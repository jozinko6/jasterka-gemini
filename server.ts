import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  fallbackCategories,
  fallbackSettings,
  fallbackDailyMenu,
  setFallbackDailyMenu,
  fallbackCouriers,
  type FallbackMenuItem,
  type FallbackCourier,
} from "./src/data/fallbackData.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const prisma = (hasDatabase ? new PrismaClient() : null) as unknown as PrismaClient;

// Fallback storage for orders (in-memory) - use global to survive HMR
const globalForOrders = globalThis as any;
if (!globalForOrders.__fallbackOrders) {
  globalForOrders.__fallbackOrders = [];
}
const fallbackOrders: any[] = globalForOrders.__fallbackOrders;

function getFallbackCategories() {
  return fallbackCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.isActive !== false),
    }))
    .sort((a, b) => a.order - b.order);
}

function getFallbackItem(id: string) {
  for (const category of fallbackCategories) {
    const item = category.items.find((entry) => entry.id === id);
    if (item) return item;
  }
  return null;
}

function updateFallbackItem(id: string, data: Partial<FallbackMenuItem>) {
  const item = getFallbackItem(id);
  if (!item) return null;

  Object.assign(item, data);

  if (data.categoryId && !fallbackCategories.some((category) => category.id === data.categoryId)) {
    item.categoryId = fallbackCategories[0]?.id || item.categoryId;
  }

  return item;
}

export async function createApp(options: { serveClient?: boolean } = {}) {
  const { serveClient = true } = options;
  const app = express();

  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPass = (process.env.ADMIN_PASSWORD || "jasterka2024").trim();
    
    // Debug log on server side (visible in system logs if needed)
    console.log(`Login attempt with password: ${password?.length} chars`);

    if (password && password.trim() === adminPass) {
      res.json({ success: true, token: "mock-token-for-dev" });
    } else {
      res.status(401).json({ error: "Nesprávne heslo" });
    }
  });

  // Get Categories and Items
  app.get("/api/menu", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json(getFallbackCategories());
      }

      const categories = await prisma.category.findMany({
        orderBy: { order: "asc" },
        include: {
          items: {
            where: { isActive: true },
            orderBy: { name: "asc" }
          },
        },
      });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  // Create Category
  app.post("/api/admin/categories", async (req, res) => {
    try {
      const { name, slug, order } = req.body;
      if (!hasDatabase) {
        const category = {
          id: `cat-${slug || Date.now()}`,
          name,
          slug,
          order: order || fallbackCategories.length + 1,
          items: [],
        };
        fallbackCategories.push(category);
        return res.status(201).json(category);
      }

      const category = await prisma.category.create({
        data: { name, slug, order: order || 0 }
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Create Menu Item
  app.post("/api/admin/items", async (req, res) => {
    try {
      const { name, description, price, image, categoryId, tag, isPizza } = req.body;
      if (!hasDatabase) {
        const category = fallbackCategories.find((entry) => entry.id === categoryId) || fallbackCategories[0];
        const item = {
          id: `item-${Date.now()}`,
          name,
          description,
          price: Number(price),
          image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080",
          categoryId: category.id,
          tag,
          isPizza: isPizza || false,
          isActive: true,
          allergens: req.body.allergens || null,
        };
        category.items.push(item);
        return res.status(201).json(item);
      }

      const item = await prisma.menuItem.create({
        data: {
          name,
          description,
          price,
          image,
          categoryId,
          tag,
          isPizza: isPizza || false,
        }
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  // Update Menu Item
  app.patch("/api/admin/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!hasDatabase) {
        const item = updateFallbackItem(id, {
          ...data,
          price: data.price === undefined ? undefined : Number(data.price),
        });
        if (!item) return res.status(404).json({ error: "Menu item not found" });
        return res.json(item);
      }

      const item = await prisma.menuItem.update({
        where: { id },
        data
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  // Delete Menu Item (Soft delete by setting isActive to false)
  app.delete("/api/admin/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        const item = updateFallbackItem(id, { isActive: false });
        if (!item) return res.status(404).json({ error: "Menu item not found" });
        return res.status(204).send();
      }

      await prisma.menuItem.update({
        where: { id },
        data: { isActive: false }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // -- LOYALTY & COUPONS --

  // Get User Points and History
  app.get("/api/loyalty/:email", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.status(404).json({ error: "User not found" });
      }

      const { email } = req.params;
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          loyaltyHistory: {
            orderBy: { createdAt: "desc" },
            take: 10
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        points: user.points,
        history: user.loyaltyHistory
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loyalty data" });
    }
  });

  // Check Coupon
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.status(404).json({ error: "Neplatny kupon" });
      }

      const { code, total } = req.body;
      const coupon = await prisma.coupon.findUnique({
        where: { code, isActive: true }
      });

      if (!coupon) {
        return res.status(404).json({ error: "Neplatný kupón" });
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Kupón expiroval" });
      }

      if (coupon.minOrder && total < Number(coupon.minOrder)) {
        return res.status(400).json({ error: `Minimálna suma pre tento kupón je ${coupon.minOrder} €` });
      }

      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Chyba pri validácii kupónu" });
    }
  });

  // Create Order (Updated with points logic)
  app.post("/api/orders", async (req, res) => {
    try {
      const { type, items, total, deliveryFee, deliveryAddress, deliveryCity, customerName, customerPhone, customerEmail, couponCode } = req.body;
      if (!hasDatabase) {
        const order = {
          id: `order-${Date.now()}`,
          status: "NEW",
          type: type === "delivery" ? "DELIVERY" : "PICKUP",
          total,
          deliveryFee: deliveryFee || 0,
          customerName,
          customerPhone,
          deliveryCity,
          deliveryAddress,
          customerEmail,
          couponCode,
          createdAt: new Date().toISOString(),
          items: items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            menuItem: getFallbackItem(item.id) || { name: item.name || item.id },
            itemName: item.name || null,
          })),
        };
        console.log('[FALLBACK] Ukladam objednavku do fallbackOrders. Aktualny pocet:', fallbackOrders.length);
        fallbackOrders.unshift(order);
        console.log('[FALLBACK] Po ulozeni pocet:', fallbackOrders.length);
        notifyOrderClients(order);
        return res.status(201).json(order);
      }

      // Calculate points to award (1 point for each 1 EUR)
      const pointsToAward = Math.floor(total);

      // Verify menuItemIds exist in database, fall back to itemName if not
      const orderItemsData = await Promise.all(items.map(async (item: any) => {
        if (item.type === "daily") {
          return { itemName: item.name, quantity: item.quantity, price: item.price };
        }
        // Check if menuItem exists
        const menuItem = hasDatabase ? await prisma.menuItem.findUnique({ where: { id: item.id } }) : null;
        if (menuItem) {
          return { menuItemId: item.id, quantity: item.quantity, price: item.price };
        }
        // Fallback to itemName if menuItem not found
        return { itemName: item.name || item.id, quantity: item.quantity, price: item.price };
      }));

      const order = await prisma.order.create({
        data: {
          type: type === "delivery" ? "DELIVERY" : "PICKUP",
          total,
          deliveryFee: deliveryFee || 0,
          customerName,
          customerPhone,
          deliveryCity,
          deliveryAddress,
          items: {
            create: orderItemsData,
          },
          // If customerEmail is provided, link to user or create one
          ...(customerEmail && {
            user: {
              connectOrCreate: {
                where: { email: customerEmail },
                create: { 
                  email: customerEmail,
                  password: "temporary-pass", // In real app, handling auth properly
                  name: customerEmail.split('@')[0],
                }
              }
            }
          })
        },
        include: {
          items: {
            include: { menuItem: true }
          },
        },
      });

      // Award points if user is linked
      if (customerEmail) {
        await prisma.user.update({
          where: { email: customerEmail },
          data: {
            points: { increment: pointsToAward },
            loyaltyHistory: {
              create: {
                amount: pointsToAward,
                type: "EARNED",
                orderId: order.id
              }
            }
          }
        });
      }

      // Notify SSE clients
      notifyOrderClients(order);

      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // SSE for Admin Orders
  let clients: any[] = [];
  const notifyOrderClients = (order: any) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(order)}\n\n`));
  };

  app.get("/api/admin/orders/events", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    req.on('close', () => {
      clients = clients.filter(client => client.id !== clientId);
    });
  });

  // Get Orders (Admin)
  app.get("/api/admin/orders", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json(fallbackOrders);
      }

      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update Order Status (Admin)
  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!hasDatabase) {
        const order = fallbackOrders.find((o) => o.id === id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        order.status = status;
        return res.json(order);
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Get Order Status (Client Polling)
  app.get("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;

      if (!hasDatabase) {
        const order = fallbackOrders.find((o) => o.id === id);
        return res.json({ status: order?.status || "NEW" });
      }

      const order = await prisma.order.findUnique({
        where: { id },
        select: { status: true },
      });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order status" });
    }
  });

  // -- RESERVATIONS --

  // Create Reservation
  app.post("/api/reservations", async (req, res) => {
    try {
      const { name, email, phone, date, guests, note } = req.body;
      if (!hasDatabase) {
        return res.status(201).json({
          id: `reservation-${Date.now()}`,
          name,
          email,
          phone,
          date,
          guests: parseInt(guests),
          note,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        });
      }

      const reservation = await prisma.reservation.create({
        data: {
          name,
          email,
          phone,
          date: new Date(date),
          guests: parseInt(guests),
          note,
          status: "PENDING"
        }
      });
      res.status(201).json(reservation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  // Get Reservations (Admin)
  app.get("/api/admin/reservations", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json([]);
      }

      const reservations = await prisma.reservation.findMany({
        orderBy: { date: "asc" }
      });
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  // Update Reservation Status (Admin)
  app.patch("/api/admin/reservations/:id/status", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json({ id: req.params.id, status: req.body.status });
      }

      const { id } = req.params;
      const { status } = req.body;
      const reservation = await prisma.reservation.update({
        where: { id },
        data: { status: status as any }
      });
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reservation status" });
    }
  });

  // -- DAILY MENU (WEEKLY) --

  // Get Current Daily Menu
  app.get("/api/daily-menu", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json(fallbackDailyMenu);
      }

      const menu = await prisma.dailyMenu.findFirst({
        orderBy: { date: "desc" },
        include: {
          items: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      });
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily menu" });
    }
  });

  // Update Daily Menu (Admin)
  app.post("/api/admin/daily-menu", async (req, res) => {
    try {
      const { content, date, items = [] } = req.body;
      if (!hasDatabase) {
        setFallbackDailyMenu(content, date || new Date().toISOString().split("T")[0], items);
        return res.json(fallbackDailyMenu);
      }

      const normalizedDate = new Date(date || new Date().toISOString().split('T')[0]);
      normalizedDate.setHours(0, 0, 0, 0);

      const menu = await prisma.dailyMenu.upsert({
        where: { date: normalizedDate },
        update: { 
          content,
          items: {
            deleteMany: {},
            create: items.map((item: any, index: number) => ({
              name: item.name,
              description: item.description || "",
              price: Number(item.price || 0),
              order: index + 1,
              isActive: item.isActive !== false,
            })),
          },
        },
        create: { 
          content, 
          date: normalizedDate,
          items: {
            create: items.map((item: any, index: number) => ({
              name: item.name,
              description: item.description || "",
              price: Number(item.price || 0),
              order: index + 1,
              isActive: item.isActive !== false,
            })),
          },
        },
        include: {
          items: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      });
      res.json(menu);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update daily menu" });
    }
  });

  // -- SETTINGS & CMS --

  // Get All Settings
  app.get("/api/settings", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json(fallbackSettings);
      }

      const settings = await prisma.restaurantSetting.findMany();
      const settingsMap = settings.reduce((acc: any, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update Settings (Admin)
  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settings = req.body; // Expecting { key1: value1, key2: value2 }
      if (!hasDatabase) {
        Object.entries(settings).forEach(([key, value]) => {
          fallbackSettings[key] = String(value);
        });
        return res.json({ success: true });
      }
      
      const updatePromises = Object.entries(settings).map(([key, value]) => {
        return prisma.restaurantSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      });

      await Promise.all(updatePromises);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Seed Menu Endpoint (One-time or emergency use)
  app.post("/api/admin/seed", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json({ success: true, message: "Fallback menu is already available" });
      }

      // 1. Categories
      const cats = [
        { name: "Pizza", slug: "pizza", order: 1 },
        { name: "Pizza štangle", slug: "pizza-stangle", order: 2 },
        { name: "Focaccio", slug: "focaccio", order: 3 },
        { name: "Polievky", slug: "polievky", order: 4 },
        { name: "Jedlá z hydiny", slug: "hydina", order: 5 },
        { name: "Jedlá z hovädzieho mäsa", slug: "hovadzie", order: 6 },
        { name: "Jedlá z bravčového mäsa", slug: "bravcove", order: 7 },
        { name: "Špeciality podniku", slug: "speciality", order: 8 },
        { name: "Misy pre 2 osoby", slug: "misy", order: 9 },
        { name: "Syrové špeciality", slug: "syry", order: 10 },
        { name: "Bezmäsité jedlá", slug: "bezmasite", order: 11 },
        { name: "Šaláty", slug: "salaty", order: 12 },
        { name: "Medzinárodná kuchyňa", slug: "medzinarodna", order: 13 },
        { name: "Múčne jedlá", slug: "mucne", order: 14 },
        { name: "Prílohy", slug: "prilohy", order: 15 },
        { name: "Šalátové prílohy", slug: "salatove-prilohy", order: 16 },
      ];

      const categoryMap: Record<string, string> = {};
      for (const cat of cats) {
        const createdCat = await prisma.category.upsert({
          where: { slug: cat.slug },
          update: cat,
          create: cat,
        });
        categoryMap[cat.slug] = createdCat.id;
      }

      const items = [
        // PIZZAS
        { name: "1. Margerita", description: "Pomodoro, bazalka, syr", price: 7.20, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "2. Šunková", description: "Pomodoro, šunka, syr", price: 7.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "3. Salámová", description: "Pomodoro, salám, syr", price: 7.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "4. Šampiňónová", description: "Pomodoro, šunka, šampiňóny, syr", price: 7.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "5. Študentská", description: "Pomodoro, šunka, kukurica, syr", price: 7.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "6. Hawai", description: "Pomodoro, šunka, ananás, syr", price: 7.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "7. Quatro Formaggi", description: "Pomodoro, 4 druhy syra (niva, údený syr, mozarella, eidam)", price: 9.00, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "8. Provinciále", description: "Pomodoro, šunka, kukurica, šampiňóny, feferóny, slanina, syr", price: 8.40, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "9. Gazdovská", description: "Pomodoro, salám, klobása, slanina, cibuľa, feferóny, syr", price: 8.80, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "10. Diavola", description: "Pomodoro, šunka, pikantný salám, chilli, paprika, syr", price: 8.30, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "11. Pikante", description: "Pomodoro, pikantný salám, chilli, cibuľa, syr", price: 8.30, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "12. Vegetariánska", description: "Pomodoro, šampiňóny, kukurica, brokolica, paradajky, olivy, syr", price: 8.50, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "13. Špek", description: "Pomodoro, šunka, kukurica, slanina, tavený syr, syr", price: 8.40, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "14. Talianská", description: "Pomodoro, paradajky, prosciutto, rucola, parmezán, syr", price: 9.50, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "15. Tuniaková", description: "Pomodoro, tuniak, cibuľa, olivy, syr", price: 8.40, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,4,7" },
        { name: "16. Hermelínová", description: "Pomodoro, šunka, hermelín, syr, brusnicová omáčka", price: 8.60, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },
        { name: "17. Jašterka", description: "Pomodoro, kuracie mäso, niva, hermelín, rucola, syr, sweet chilli omáčka", price: 9.90, categoryId: categoryMap["pizza"], isPizza: true, allergens: "1,7" },

        // PIZZA STANGLE
        { name: "1. Pizza štangle s dresingom", description: "250g", price: 4.50, categoryId: categoryMap["pizza-stangle"], allergens: "1,3,7" },
        { name: "2. Pizza štangle syrové", description: "Pomodoro, syr, 450g", price: 7.20, categoryId: categoryMap["pizza-stangle"], allergens: "1,7" },
        { name: "3. Pizza štangle šunkové", description: "Pomodoro, šunka, syr, 470g", price: 7.40, categoryId: categoryMap["pizza-stangle"], allergens: "1,7" },
        { name: "4. Pizza štangle slaninové", description: "Pomodoro, slanina, údený syr, 470g", price: 7.80, categoryId: categoryMap["pizza-stangle"], allergens: "1,7" },
        { name: "5. Pizza štangle nivové", description: "Pomodoro, slanina, niva, 470g", price: 8.00, categoryId: categoryMap["pizza-stangle"], allergens: "1,7" },
        { name: "6. Pizza štangle gazdovské", description: "Pomodoro, slanina, klobása, kukurica, syr, 500g", price: 8.60, categoryId: categoryMap["pizza-stangle"], allergens: "1,7" },

        // FOCACCIO
        { name: "1. Focaccio s kuracím mäsom", description: "Dresing, zelenina, kuracie mäso, 2ks 500g", price: 8.20, categoryId: categoryMap["focaccio"], allergens: "1,3,7" },
        { name: "2. Focaccio s prosciuttom", description: "Dresing, šalát, mozzarella, prosciutto, 2ks 480g", price: 9.30, categoryId: categoryMap["focaccio"], allergens: "1,3,7" },

        // POLIEVKY
        { name: "Hráškový krém s krutónmi", description: "0,33l", price: 3.50, categoryId: categoryMap["polievky"], allergens: "obilniny, mlieko" },
        { name: "Tekvicová Hokaido s krutónmi", description: "0,33l", price: 3.50, categoryId: categoryMap["polievky"], allergens: "obilniny, mlieko" },

        // HYDINA
        { name: "Černohorský kurací rezeň", description: "150g | zemiakové cestíčko", price: 9.50, categoryId: categoryMap["hydina"], allergens: "obilniny, vajcia" },
        { name: "Prsia v strúhanke", description: "150g", price: 8.00, categoryId: categoryMap["hydina"], allergens: "obilniny, vajcia" },
        { name: "Prsia v cestíčku", description: "150g", price: 8.00, categoryId: categoryMap["hydina"], allergens: "obilniny, vajcia" },
        { name: "Zapekané prsia s ananásom", description: "150g | šunka, syr, ananás", price: 8.50, categoryId: categoryMap["hydina"], allergens: "obilniny" },
        { name: "Prsia s nivovou omáčkou", description: "150g", price: 8.50, categoryId: categoryMap["hydina"], allergens: "mlieko" },
        { name: "Plnené prsia", description: "150g | šunka, syr", price: 9.50, categoryId: categoryMap["hydina"], allergens: "obilniny, vajcia, mlieko" },

        // HOVADZIE
        { name: "Sviečkové medailónky", description: "200g | 3 ks", price: 12.00, categoryId: categoryMap["hovadzie"], allergens: "obilniny, horčica" },
        { name: "Hovädzí steak s jemnou omáčkou", description: "200g", price: 19.50, categoryId: categoryMap["hovadzie"], allergens: "obilniny, mlieko" },
        { name: "Sviečková Stroganov", description: "200g | uhorka sterilizovaná, šampiňóny, smotana, horčica", price: 13.00, categoryId: categoryMap["hovadzie"], allergens: "mlieko, horčica" },

        // BRAVCOVE
        { name: "Slovenský zákusok – vyprážaný rezeň", description: "150g", price: 8.50, categoryId: categoryMap["bravcove"], allergens: "obilniny, vajcia" },
        { name: "Bačovský rezeň", description: "150g | šunka, syr, slanina", price: 9.50, categoryId: categoryMap["bravcove"], allergens: "obilniny, vajcia" },
        { name: "Cigánska po našom s cesnakom", description: "150g", price: 8.50, categoryId: categoryMap["bravcove"], allergens: "obilniny, horčica" },
        { name: "Černohorský rezeň", description: "150g | zemiakové cestíčko", price: 9.50, categoryId: categoryMap["bravcove"], allergens: "obilniny, vajcia" },
        { name: "Bravčové medailónky s plackami", description: "150g | 3 ks medailónky z bravčovej panenky + 3 ks placka", price: 9.50, categoryId: categoryMap["bravcove"], allergens: "obilniny, vajcia" },

        // SPECIALITY
        { name: "Rezeň JAŠTERKA XXL", description: "200g | kurací/bravčový v rôznom cestíčku", price: 10.50, categoryId: categoryMap["speciality"], allergens: "obilniny, vajcia" },
        { name: "Chrumkavý kurací rezeň", description: "150g | kuracie prsia, cornflexy", price: 9.00, categoryId: categoryMap["speciality"], allergens: "obilniny, vajcia" },
        { name: "Kačacie prsia so slivkovo – smotanovou omáčkou", description: "200g", price: 13.50, categoryId: categoryMap["speciality"], allergens: "mlieko" },
        { name: "Kuracie medailónky s plackami (syrová/nivová)", description: "150g | obloha", price: 9.50, categoryId: categoryMap["speciality"], allergens: "obilniny, mlieko" },
        { name: "Špecialita JAŠTERKA PIKANT – malá", description: "150g", price: 6.50, categoryId: categoryMap["speciality"], allergens: "horčica" },
        { name: "Špecialita JAŠTERKA PIKANT – veľká", description: "250g", price: 8.50, categoryId: categoryMap["speciality"], allergens: "horčica" },
        { name: "Plnená placka so špecialitou", description: "250g", price: 9.50, categoryId: categoryMap["speciality"], allergens: "obilniny, vajcia, mlieko, horčica" },
        { name: "Bravčové medailónky z panenskej (3ks) na fazuľkách", description: "150g", price: 10.50, categoryId: categoryMap["speciality"] },
        { name: "Omáčky extra (Dubáková / Nivová / Syrová)", description: "150g", price: 3.00, categoryId: categoryMap["speciality"] },

        // MISY
        { name: "Misa pre 2 osoby BRAVČOVO – KURACIA", description: "800g mäsa + prílohy + šalát", price: 33.00, categoryId: categoryMap["misy"], allergens: "obilniny, vajcia, mlieko, horčica" },
        { name: "Misa pre 2 osoby MIX", description: "600g mäsa + špízy + prílohy", price: 33.00, categoryId: categoryMap["misy"], allergens: "obilniny, vajcia, mlieko, horčica" },
        { name: "Misa pre 2 osoby GRILL", description: "600g mäsa na grile + prílohy", price: 33.00, categoryId: categoryMap["misy"], allergens: "obilniny, vajcia, mlieko, horčica" },

        // SYRY
        { name: "Vyprážaný syr (Eidam)", description: "100g", price: 6.00, categoryId: categoryMap["syry"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Vyprážaný syr so šunkou", description: "120g", price: 6.50, categoryId: categoryMap["syry"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Syrový špíz kombinovaný", description: "150g", price: 8.50, categoryId: categoryMap["syry"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Vyprážaný údený syr", description: "120g", price: 6.50, categoryId: categoryMap["syry"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Vyprážaný Encián", description: "120g", price: 6.00, categoryId: categoryMap["syry"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Grilovaný Encián s brusnicami", description: "120g", price: 6.00, categoryId: categoryMap["syry"], allergens: "mlieko" },

        // BEZMASITE
        { name: "Vyprážané šampiňóny", description: "200g", price: 7.50, categoryId: categoryMap["bezmasite"], allergens: "obilniny, vajcia" },
        { name: "Vyprážaný karfiol", description: "200g", price: 7.50, categoryId: categoryMap["bezmasite"], allergens: "obilniny, vajcia" },
        { name: "Vyprážaná brokolica", description: "200g", price: 7.50, categoryId: categoryMap["bezmasite"], allergens: "obilniny, vajcia" },

        // SALATY
        { name: "Kráľovský šalát", description: "350g | slaninka, šampiňóny, syr", price: 8.00, categoryId: categoryMap["salaty"], allergens: "mlieko" },
        { name: "Šalát s kačacími prsiami (Letná kačka)", description: "400g", price: 12.00, categoryId: categoryMap["salaty"], allergens: "mlieko" },
        { name: "Šalát s grilovaným lososom", description: "350g", price: 12.50, categoryId: categoryMap["salaty"], allergens: "ryby" },
        { name: "Grécky šalát", description: "350g", price: 5.20, categoryId: categoryMap["salaty"], allergens: "mlieko" },
        { name: "Fit tanier", description: "350g | opekané prsia", price: 8.50, categoryId: categoryMap["salaty"], allergens: "mlieko" },
        { name: "Naša bomba", description: "350g | vyprážaný rezeň", price: 8.50, categoryId: categoryMap["salaty"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Šalát Jašterka", description: "350g | nugetky v cornflakesoch", price: 8.50, categoryId: categoryMap["salaty"], allergens: "obilniny, vajcia" },
        { name: "Šalát s grilovaným enciánom", description: "350g", price: 8.00, categoryId: categoryMap["salaty"], allergens: "mlieko" },
        { name: "Šalát Cézar", description: "350g", price: 8.50, categoryId: categoryMap["salaty"], allergens: "obilniny, mlieko" },
        { name: "Hrianka k šalátu", description: "2ks", price: 0.50, categoryId: categoryMap["salaty"], allergens: "obilniny" },

        // MEDZINARODNA
        { name: "Mexické bravčové soté", description: "150g", price: 8.50, categoryId: categoryMap["medzinarodna"] },
        { name: "Indické kuracie soté s ananásom na kari", description: "150g", price: 8.50, categoryId: categoryMap["medzinarodna"], allergens: "mlieko, orechy" },

        // MUCNE (DESSERTS)
        { name: "Palacinky s džemom", description: "2 ks, šľahačka, čokoláda", price: 6.00, categoryId: categoryMap["mucne"], allergens: "obilniny, vajcia, mlieko" },
        { name: "Palacinky s nutelou", description: "2 ks, šľahačka, čokoláda, orechy", price: 6.50, categoryId: categoryMap["mucne"], allergens: "obilniny, vajcia, mlieko, orechy" },
        { name: "Vafle Jašterka", description: "170g | 3 ks, zmrzlina, lesná zmes", price: 6.00, categoryId: categoryMap["mucne"], allergens: "obilniny, vajcia, mlieko, orechy" },

        // PRILOHY (SIDES)
        { name: "Varené zemiaky s maslom", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Opekané zemiaky", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Hranolky", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Krokety", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Americké zemiaky", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Zemiaková kaša", description: "200g", price: 2.50, categoryId: categoryMap["prilohy"], allergens: "mlieko" },
        { name: "Dusená ryža", description: "150g", price: 2.50, categoryId: categoryMap["prilohy"] },
        { name: "Horčica", description: "25g", price: 1.00, categoryId: categoryMap["prilohy"], allergens: "horčica" },
        { name: "Kečup", description: "50g", price: 1.50, categoryId: categoryMap["prilohy"] },
        { name: "Tatárska omáčka", description: "50g", price: 1.50, categoryId: categoryMap["prilohy"], allergens: "mlieko" },
        { name: "Zeleninová obloha", description: "100g", price: 2.00, categoryId: categoryMap["prilohy"] },
        { name: "Feferón 1 ks", description: "5g", price: 0.30, categoryId: categoryMap["prilohy"] },

        // SALATOVE PRILOHY
        { name: "Kapustový šalát", description: "150g", price: 2.50, categoryId: categoryMap["salatove-prilohy"] },
        { name: "Uhorka sterilizovaná", description: "120g", price: 1.50, categoryId: categoryMap["salatove-prilohy"] },
        { name: "Kapusta kvasená", description: "120g", price: 2.00, categoryId: categoryMap["salatove-prilohy"] },
        { name: "Sezónny letný šalát", description: "150g", price: 2.50, categoryId: categoryMap["salatove-prilohy"] },
        { name: "Šopský miešaný šalát so syrom", description: "150g", price: 4.00, categoryId: categoryMap["salatove-prilohy"], allergens: "mlieko" },
        { name: "Dressing (Americký, Bylinkový, atď)", description: "50g", price: 1.50, categoryId: categoryMap["salatove-prilohy"], allergens: "mlieko" },
      ];

      for (const item of items) {
        await prisma.menuItem.upsert({
          where: { id: `item-${item.name.replace(/\s+/g, "-").toLowerCase()}` },
          update: item,
          create: {
            ...item,
            id: `item-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080" // Default image for all new items
          },
        });
      }

      // Seed Daily Menu
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.dailyMenu.upsert({
        where: { date: today },
        update: {},
        create: {
          date: today,
          content: "Jedálny lístok na dnešný deň:\n\nPolievka:\n- Slepačí vývar s rezancami (0,33l)\n- Fazuľová so zeleninou (0,33l)\n\nHlavné jedlá:\n1. Vyprážaný kurací rezeň, zemiaková kaša, kyslá uhorka (150g/200g)\n2. Bravčový perkelt s maslovými haluškami (150g/200g)\n3. Šalát s grilovaným oštiepkom a brusnicovým dressingom (300g)"
        }
      });

      res.json({ success: true, message: "Menu and Daily Menu successfully seeded" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to seed menu" });
    }
  });

  // -- COURIER MANAGEMENT --

  // Get all couriers
  app.get("/api/admin/couriers", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json(fallbackCouriers);
      }

      const couriers = await prisma.courier.findMany({
        include: {
          user: { select: { name: true, email: true } },
          orders: {
            where: { status: { notIn: ["COMPLETED", "REJECTED"] } },
            select: { id: true },
          },
        },
      });

      const result = couriers.map((c) => ({
        id: c.id,
        name: c.user?.name || "Neznámy",
        phone: c.user?.email || "",
        vehicleType: c.vehicleType,
        isOnline: c.isOnline,
        activeOrdersCount: c.orders.length,
      }));

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch couriers" });
    }
  });

  // Create a courier
  app.post("/api/admin/couriers", async (req, res) => {
    try {
      const { name, phone, vehicleType } = req.body;
      if (!hasDatabase) {
        const courier: FallbackCourier = {
          id: `courier-${Date.now()}`,
          name,
          phone,
          vehicleType: vehicleType || "CAR",
          isOnline: false,
          activeOrdersCount: 0,
        };
        fallbackCouriers.push(courier);
        return res.status(201).json(courier);
      }

      // Create user + courier profile
      const user = await prisma.user.create({
        data: {
          email: `courier-${Date.now()}@jasterka.sk`,
          password: "temporary",
          name,
          role: "DELIVERY",
          courierProfile: {
            create: {
              vehicleType: vehicleType || "CAR",
              isOnline: false,
            },
          },
        },
        include: { courierProfile: true },
      });

      res.status(201).json({
        id: user.courierProfile!.id,
        name: user.name,
        phone: user.email,
        vehicleType: user.courierProfile!.vehicleType,
        isOnline: user.courierProfile!.isOnline,
        activeOrdersCount: 0,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create courier" });
    }
  });

  // Toggle courier online status
  app.patch("/api/admin/couriers/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        const courier = fallbackCouriers.find((c) => c.id === id);
        if (!courier) return res.status(404).json({ error: "Courier not found" });
        courier.isOnline = !courier.isOnline;
        return res.json(courier);
      }

      const courier = await prisma.courier.findUnique({ where: { id } });
      if (!courier) return res.status(404).json({ error: "Courier not found" });

      const updated = await prisma.courier.update({
        where: { id },
        data: { isOnline: !courier.isOnline },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle courier status" });
    }
  });

  // Delete a courier
  app.delete("/api/admin/couriers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        const idx = fallbackCouriers.findIndex((c) => c.id === id);
        if (idx === -1) return res.status(404).json({ error: "Courier not found" });
        fallbackCouriers.splice(idx, 1);
        return res.status(204).send();
      }

      const courier = await prisma.courier.findUnique({ where: { id }, include: { user: true } });
      if (!courier) return res.status(404).json({ error: "Courier not found" });

      await prisma.courier.delete({ where: { id } });
      if (courier.user) {
        await prisma.user.delete({ where: { id: courier.user.id } });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete courier" });
    }
  });

  // -- COURIER SHIFTS --

  // Get shifts for a courier
  app.get("/api/admin/couriers/:id/shifts", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        return res.json([]);
      }

      const shifts = await prisma.courierShift.findMany({
        where: { courierId: id },
        orderBy: { startTime: "desc" },
        take: 20,
      });
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  // Create a shift for a courier
  app.post("/api/admin/couriers/:id/shifts", async (req, res) => {
    try {
      const { id } = req.params;
      const { startTime, endTime, isPeak } = req.body;

      if (!hasDatabase) {
        return res.status(201).json({
          id: `shift-${Date.now()}`,
          courierId: id,
          startTime,
          endTime,
          isPeak: isPeak || false,
          status: "SCHEDULED",
          earnings: 0,
        });
      }

      const shift = await prisma.courierShift.create({
        data: {
          courierId: id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isPeak: isPeak || false,
          status: "SCHEDULED",
        },
      });
      res.status(201).json(shift);
    } catch (error) {
      res.status(500).json({ error: "Failed to create shift" });
    }
  });

  // Update shift status (start/complete/cancel)
  app.patch("/api/admin/shifts/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!hasDatabase) {
        return res.json({ id, status });
      }

      const shift = await prisma.courierShift.update({
        where: { id },
        data: { status },
      });
      res.json(shift);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shift status" });
    }
  });

  // -- COURIER EARNINGS --

  // Get earnings for a courier
  app.get("/api/admin/couriers/:id/earnings", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        return res.json([]);
      }

      const earnings = await prisma.courierEarning.findMany({
        where: { courierId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  // Get earnings summary for a courier
  app.get("/api/admin/couriers/:id/earnings/summary", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        return res.json({ totalEarnings: 0, thisWeek: 0, today: 0, deliveriesCount: 0 });
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [totalAgg, weekAgg, todayAgg, deliveriesCount] = await Promise.all([
        prisma.courierEarning.aggregate({
          where: { courierId: id },
          _sum: { total: true },
        }),
        prisma.courierEarning.aggregate({
          where: { courierId: id, createdAt: { gte: startOfWeek } },
          _sum: { total: true },
        }),
        prisma.courierEarning.aggregate({
          where: { courierId: id, createdAt: { gte: startOfToday } },
          _sum: { total: true },
        }),
        prisma.courierEarning.count({
          where: { courierId: id, type: "DELIVERY" },
        }),
      ]);

      res.json({
        totalEarnings: totalAgg._sum.total || 0,
        thisWeek: weekAgg._sum.total || 0,
        today: todayAgg._sum.total || 0,
        deliveriesCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earnings summary" });
    }
  });

  // Record a delivery earning
  app.post("/api/admin/earnings", async (req, res) => {
    try {
      const { courierId, orderId, shiftId, baseFee, distanceBonus, batchBonus, peakHourBonus, performanceBonus, type } = req.body;

      const total = (baseFee || 0) + (distanceBonus || 0) + (batchBonus || 0) + (peakHourBonus || 0) + (performanceBonus || 0);

      if (!hasDatabase) {
        return res.status(201).json({
          id: `earning-${Date.now()}`,
          courierId,
          orderId,
          shiftId,
          baseFee: baseFee || 0,
          distanceBonus: distanceBonus || 0,
          batchBonus: batchBonus || 0,
          peakHourBonus: peakHourBonus || 0,
          performanceBonus: performanceBonus || 0,
          total,
          type: type || "DELIVERY",
          createdAt: new Date().toISOString(),
        });
      }

      const earning = await prisma.courierEarning.create({
        data: {
          courierId,
          orderId,
          shiftId,
          baseFee: baseFee || 0,
          distanceBonus: distanceBonus || 0,
          batchBonus: batchBonus || 0,
          peakHourBonus: peakHourBonus || 0,
          performanceBonus: performanceBonus || 0,
          total,
          type: type || "DELIVERY",
        },
      });

      // Update courier total earnings
      await prisma.courier.update({
        where: { id: courierId },
        data: { totalEarnings: { increment: total } },
      });

      res.status(201).json(earning);
    } catch (error) {
      res.status(500).json({ error: "Failed to record earning" });
    }
  });

  // -- SMART EARNINGS ENGINE --

  // Auto-calculate earnings for a completed delivery
  app.post("/api/admin/earnings/calculate", async (req, res) => {
    try {
      const { courierId, orderId, distanceKm, vehicleType, isPeak, batchSize, courierRating } = req.body;

      // Base Fee (Master Plan model)
      let baseFee = vehicleType === 'CAR' ? 3.00 : 2.00;

      // Distance Bonus
      const distanceRate = vehicleType === 'CAR' ? 0.55 : 0.35;
      const distanceBonus = (distanceKm || 0) * distanceRate;

      // Batch Bonus
      let batchBonus = 0;
      if (batchSize && batchSize > 1) {
        batchBonus = Math.min(1 + (batchSize - 1) * 1.5, 4.0);
      }

      // Peak Hour Bonus (10% - 25%)
      let peakHourBonus = 0;
      if (isPeak) {
        const peakMultiplier = 0.10 + (courierRating || 5.0) * 0.03;
        peakHourBonus = (baseFee + distanceBonus) * Math.min(peakMultiplier, 0.25);
      }

      // Performance Bonus (based on rating)
      let performanceBonus = 0;
      if (courierRating && courierRating >= 4.5) {
        performanceBonus = (baseFee + distanceBonus) * 0.10;
      } else if (courierRating && courierRating >= 4.0) {
        performanceBonus = (baseFee + distanceBonus) * 0.05;
      }

      const total = baseFee + distanceBonus + batchBonus + peakHourBonus + performanceBonus;

      if (!hasDatabase) {
        return res.json({
          baseFee: Math.round(baseFee * 100) / 100,
          distanceBonus: Math.round(distanceBonus * 100) / 100,
          batchBonus: Math.round(batchBonus * 100) / 100,
          peakHourBonus: Math.round(peakHourBonus * 100) / 100,
          performanceBonus: Math.round(performanceBonus * 100) / 100,
          total: Math.round(total * 100) / 100,
        });
      }

      // Create the earning record
      const earning = await prisma.courierEarning.create({
        data: {
          courierId,
          orderId,
          baseFee: Math.round(baseFee * 100) / 100,
          distanceBonus: Math.round(distanceBonus * 100) / 100,
          batchBonus: Math.round(batchBonus * 100) / 100,
          peakHourBonus: Math.round(peakHourBonus * 100) / 100,
          performanceBonus: Math.round(performanceBonus * 100) / 100,
          total: Math.round(total * 100) / 100,
          type: "DELIVERY",
        },
      });

      // Update courier total earnings
      await prisma.courier.update({
        where: { id: courierId },
        data: { totalEarnings: { increment: earning.total } },
      });

      res.status(201).json(earning);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate earnings" });
    }
  });

  // Get courier leaderboard
  app.get("/api/admin/couriers/leaderboard", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json([]);
      }

      const couriers = await prisma.courier.findMany({
        include: {
          user: { select: { name: true } },
          earnings: {
            where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            select: { total: true },
          },
          shifts: {
            where: { status: "COMPLETED" },
            select: { id: true },
          },
          deliveryTasks: {
            where: { status: "DELIVERED" },
            select: { id: true, distanceKm: true },
          },
        },
      });

      const leaderboard = couriers.map(c => {
        const courier = c as any;
        return {
          id: courier.id,
          name: courier.user?.name || "Neznámy",
          vehicleType: courier.vehicleType,
          rating: courier.rating,
          totalEarnings: courier.totalEarnings,
          monthlyEarnings: courier.earnings.reduce((sum: number, e: any) => sum + Number(e.total), 0),
          completedShifts: courier.shifts.length,
          completedDeliveries: courier.deliveryTasks.length,
          totalDistanceKm: courier.deliveryTasks.reduce((sum: number, t: any) => sum + t.distanceKm, 0),
          isOnline: courier.isOnline,
        };
      });

      // Sort by monthly earnings descending
      leaderboard.sort((a, b) => Number(b.monthlyEarnings) - Number(a.monthlyEarnings));

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get courier analytics
  app.get("/api/admin/couriers/analytics", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json({
          totalCouriers: 0,
          activeCouriers: 0,
          totalDeliveries: 0,
          totalEarnings: 0,
          avgRating: 0,
          avgDeliveryTime: 0,
          totalDistanceKm: 0,
          peakHourDeliveries: 0,
        });
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86400000);

      const [
        totalCouriers,
        activeCouriers,
        totalDeliveries,
        totalEarningsAgg,
        avgRatingAgg,
        totalDistanceAgg,
        peakDeliveries,
      ] = await Promise.all([
        prisma.courier.count(),
        prisma.courier.count({ where: { isOnline: true } }),
        prisma.deliveryTask.count({ where: { status: "DELIVERED" } }),
        prisma.courierEarning.aggregate({ _sum: { total: true } }),
        prisma.courier.aggregate({ _avg: { rating: true } }),
        prisma.deliveryTask.aggregate({ _sum: { distanceKm: true } }),
        prisma.deliveryTask.count({
          where: {
            status: "DELIVERED",
            createdAt: { gte: startOfWeek },
          },
        }),
      ]);

      res.json({
        totalCouriers,
        activeCouriers,
        totalDeliveries,
        totalEarnings: totalEarningsAgg._sum.total || 0,
        avgRating: avgRatingAgg._avg.rating || 0,
        avgDeliveryTime: 0, // Would need more data
        totalDistanceKm: totalDistanceAgg._sum.distanceKm || 0,
        peakHourDeliveries: peakDeliveries,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courier analytics" });
    }
  });

  // -- DELIVERY TASKS --

  // Get delivery tasks for a courier
  app.get("/api/admin/couriers/:id/tasks", async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabase) {
        return res.json([]);
      }

      const tasks = await prisma.deliveryTask.findMany({
        where: { courierId: id },
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              deliveryAddress: true,
              deliveryCity: true,
              total: true,
              status: true,
            },
          },
        },
        take: 20,
      });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery tasks" });
    }
  });

  // Create a delivery task
  app.post("/api/admin/delivery-tasks", async (req, res) => {
    try {
      const { courierId, orderId, distanceKm, estimatedEta } = req.body;

      if (!hasDatabase) {
        return res.status(201).json({
          id: `task-${Date.now()}`,
          courierId,
          orderId,
          status: "ASSIGNED",
          distanceKm: distanceKm || 0,
          estimatedEta: estimatedEta || 0,
          createdAt: new Date().toISOString(),
        });
      }

      const task = await prisma.deliveryTask.create({
        data: {
          courierId,
          orderId,
          distanceKm: distanceKm || 0,
          estimatedEta: estimatedEta || 0,
        },
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create delivery task" });
    }
  });

  // Update delivery task status
  app.patch("/api/admin/delivery-tasks/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!hasDatabase) {
        return res.json({ id, status });
      }

      const updateData: any = { status };
      if (status === "PICKED_UP") updateData.pickupTime = new Date();
      if (status === "DELIVERED") updateData.deliveredTime = new Date();

      const task = await prisma.deliveryTask.update({
        where: { id },
        data: updateData,
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery task" });
    }
  });

  // Assign courier to order
  app.patch("/api/admin/orders/:id/assign-courier", async (req, res) => {
    try {
      const { id } = req.params;
      const { courierId } = req.body;

      if (!hasDatabase) {
        return res.json({ id, courierId });
      }

      const order = await prisma.order.update({
        where: { id },
        data: { courierId },
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign courier" });
    }
  });

  // -- SMART DISPATCH ENGINE --

  // Scoring weights
  const DISPATCH_WEIGHTS = {
    DISTANCE: 0.35,       // 35% - how close the courier is
    VEHICLE_MATCH: 0.15,  // 15% - vehicle suitability for the order
    LOAD_FACTOR: 0.20,    // 20% - how many active orders they have
    RATING: 0.15,         // 15% - courier rating
    SHIFT_ACTIVE: 0.15,   // 15% - if they have an active shift
  };

  // Vehicle scoring - which vehicle is best for which scenario
  const VEHICLE_SCORES: Record<string, Record<string, number>> = {
    BICYCLE: { city: 10, nearby: 10, longDistance: 2, batch: 3, largeOrder: 3 },
    SCOOTER: { city: 8, nearby: 9, longDistance: 6, batch: 6, largeOrder: 5 },
    CAR: { city: 6, nearby: 7, longDistance: 10, batch: 10, largeOrder: 10 },
  };

  // Auto-dispatch: find the best courier for a given order
  app.post("/api/admin/dispatch/auto-assign", async (req, res) => {
    try {
      const { orderId, orderCity, orderAddress } = req.body;

      if (!hasDatabase) {
        return res.json({ 
          success: false, 
          error: "Auto-dispatch requires a database with couriers" 
        });
      }

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { deliveryZone: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.courierId) {
        return res.json({ 
          success: false, 
          error: "Objednávka už má priradeného kuriéra",
          courierId: order.courierId 
        });
      }

      // Get all online couriers with their current load
      const couriers = await prisma.courier.findMany({
        where: { isOnline: true },
        include: {
          user: { select: { name: true } },
          shifts: {
            where: {
              status: "ACTIVE",
              startTime: { lte: new Date() },
              endTime: { gte: new Date() },
            },
            take: 1,
          },
          orders: {
            where: { status: { in: ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] } },
            select: { id: true },
          },
        },
      });

      if (couriers.length === 0) {
        return res.json({ 
          success: false, 
          error: "Nie sú dostupní žiadni online kuriéri" 
        });
      }

      // Calculate score for each courier
      const scoredCouriers = couriers.map((courier: any) => {
        let score = 0;
        const isCityDelivery = orderCity === "Hlohovec" || orderCity === "Šulekovo";
        const hasActiveShift = courier.shifts.length > 0;
        const currentLoad = courier.orders.length;
        const vehicleType = courier.vehicleType;

        // 1. Vehicle match score (0-10)
        let vehicleScore = 0;
        const vehicleScores = VEHICLE_SCORES[vehicleType] || VEHICLE_SCORES.CAR;
        
        if (isCityDelivery) {
          vehicleScore = vehicleScores.city;
        } else {
          vehicleScore = vehicleScores.longDistance;
        }

        // Bonus for batch potential (if load is low but could take more)
        if (currentLoad < 2) {
          vehicleScore = Math.max(vehicleScore, vehicleScores.nearby);
        }

        score += (vehicleScore / 10) * DISPATCH_WEIGHTS.VEHICLE_MATCH * 100;

        // 2. Distance heuristic score (0-10) - based on vehicle type
        let distanceScore = 5;
        if (isCityDelivery && vehicleType === "BICYCLE") distanceScore = 9;
        else if (isCityDelivery && vehicleType === "SCOOTER") distanceScore = 8;
        else if (isCityDelivery && vehicleType === "CAR") distanceScore = 6;
        else if (!isCityDelivery && vehicleType === "CAR") distanceScore = 9;
        else if (!isCityDelivery && vehicleType === "SCOOTER") distanceScore = 6;
        else if (!isCityDelivery && vehicleType === "BICYCLE") distanceScore = 2;
        
        score += (distanceScore / 10) * DISPATCH_WEIGHTS.DISTANCE * 100;

        // 3. Load factor score (0-10) - less is better
        const loadScore = Math.max(0, 10 - currentLoad * 3);
        score += (loadScore / 10) * DISPATCH_WEIGHTS.LOAD_FACTOR * 100;

        // 4. Rating score (0-10)
        const ratingScore = ((courier.rating || 5.0) / 5) * 10;
        score += (ratingScore / 10) * DISPATCH_WEIGHTS.RATING * 100;

        // 5. Active shift bonus
        const shiftScore = hasActiveShift ? 10 : 3;
        score += (shiftScore / 10) * DISPATCH_WEIGHTS.SHIFT_ACTIVE * 100;

        return {
          courierId: courier.id,
          name: courier.user?.name || "Neznámy",
          vehicleType: courier.vehicleType,
          isOnline: courier.isOnline,
          currentLoad,
          rating: courier.rating || 5.0,
          hasActiveShift,
          score: Math.round(score * 100) / 100,
        };
      });

      // Sort by score descending
      scoredCouriers.sort((a, b) => b.score - a.score);
      const bestCourier = scoredCouriers[0];

      // Auto-assign the best courier
      await prisma.order.update({
        where: { id: orderId },
        data: { courierId: bestCourier.courierId },
      });

      // Create a delivery task
      await prisma.deliveryTask.create({
        data: {
          courierId: bestCourier.courierId,
          orderId: orderId,
          distanceKm: 0, // Will be updated with actual distance
          estimatedEta: 20, // Default 20 min
        },
      });

      res.json({
        success: true,
        assignedCourier: bestCourier,
        allScored: scoredCouriers,
        algorithm: "Smart Dispatch v1 - Scoring based on vehicle, location, load, rating, shift",
      });
    } catch (error) {
      console.error("Auto-dispatch failed:", error);
      res.status(500).json({ error: "Auto-dispatch failed" });
    }
  });

  // Get dispatch suggestions for a specific order (without assigning)
  app.post("/api/admin/dispatch/suggestions", async (req, res) => {
    try {
      const { orderCity } = req.body;

      if (!hasDatabase) {
        return res.json({ suggestions: [] });
      }

      const couriers = await prisma.courier.findMany({
        where: { isOnline: true },
        include: {
          user: { select: { name: true } },
          shifts: {
            where: {
              status: "ACTIVE",
              startTime: { lte: new Date() },
              endTime: { gte: new Date() },
            },
            take: 1,
          },
          orders: {
            where: { status: { in: ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] } },
            select: { id: true },
          },
        },
      });

      const isCityDelivery = orderCity === "Hlohovec" || orderCity === "Šulekovo";

      const suggestions = couriers.map((c) => {
        const courier = c as any;
        const currentLoad = courier.orders.length;
        const hasActiveShift = courier.shifts.length > 0;

        // Simple suitability score
        let suitability: string = "medium";
        if (isCityDelivery && courier.vehicleType === "BICYCLE" && currentLoad < 2 && hasActiveShift) suitability = "high";
        if (!isCityDelivery && courier.vehicleType === "CAR" && currentLoad < 3) suitability = "high";
        if (currentLoad >= 3) suitability = "low";

        return {
          courierId: courier.id,
          name: courier.user?.name || "Neznámy",
          vehicleType: courier.vehicleType,
          currentLoad,
          rating: courier.rating,
          hasActiveShift,
          suitability,
          isOnline: courier.isOnline,
        };
      });

      suggestions.sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.suitability] || 2) - (order[b.suitability] || 2);
      });

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  // -- ROUTE OPTIMIZATION ENGINE --

  // Google Maps Distance Matrix API helper
  async function getDistanceMatrix(origins: string[], destinations: string[]) {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins.join("|"))}&destinations=${encodeURIComponent(destinations.join("|"))}&key=${apiKey}&units=metric&mode=driving`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        return data.rows;
      }
      return null;
    } catch (error) {
      console.error("Distance Matrix API error:", error);
      return null;
    }
  }

  // Get optimized route for a courier's deliveries
  app.post("/api/admin/dispatch/optimize-route", async (req, res) => {
    try {
      const { courierId } = req.body;

      if (!hasDatabase) {
        return res.json({ error: "Route optimization requires a database" });
      }

      // Get courier's active delivery orders
      const activeOrders = await prisma.order.findMany({
        where: {
          courierId,
          status: { in: ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
          type: "DELIVERY",
        },
        orderBy: { createdAt: "asc" },
      });

      if (activeOrders.length === 0) {
        return res.json({ optimized: false, message: "Žiadne aktívne doručenia pre tohto kuriéra" });
      }

      // Restaurant location (Jašterka Hlohovec)
      const restaurantAddress = "Námestie sv. Michala 1, Hlohovec, Slovakia";
      const deliveryAddresses = activeOrders.map((o) => `${o.deliveryAddress}, Hlohovec, Slovakia`);

      // Get distance matrix from restaurant to all delivery points
      const matrix = await getDistanceMatrix([restaurantAddress], deliveryAddresses);

      if (!matrix) {
        // Fallback: return orders in chronological order
        return res.json({
          optimized: false,
          message: "Google Maps API nedostupná, používam chronologické poradie",
          route: activeOrders.map((o, i) => ({
            stop: i + 1,
            orderId: o.id,
            address: o.deliveryAddress,
            customerName: o.customerName,
            estimatedMinutes: 15 + i * 10,
            estimatedKm: 2 + i * 1.5,
          })),
        });
      }

      // Sort by distance from restaurant (nearest first)
      const distances = matrix[0]?.elements || [];
      const ordersWithDistance = activeOrders.map((order, index) => ({
        ...order,
        distanceMeters: distances[index]?.distance?.value || 0,
        durationSeconds: distances[index]?.duration?.value || 900,
      }));

      // Nearest neighbor sort for route optimization
      ordersWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);

      // Calculate total route stats
      const totalDistanceKm = ordersWithDistance.reduce((sum, o) => sum + o.distanceMeters / 1000, 0);
      const totalDurationMin = ordersWithDistance.reduce((sum, o) => sum + o.durationSeconds / 60, 0);

      // Update delivery tasks with actual distances
      for (const order of ordersWithDistance) {
        await prisma.deliveryTask.updateMany({
          where: { orderId: order.id },
          data: {
            distanceKm: Math.round((order.distanceMeters / 1000) * 10) / 10,
            estimatedEta: Math.round(order.durationSeconds / 60),
          },
        });
      }

      res.json({
        optimized: true,
        algorithm: "Nearest Neighbor - Google Maps Distance Matrix",
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        totalDurationMin: Math.round(totalDurationMin),
        stops: ordersWithDistance.length,
        route: ordersWithDistance.map((o, i) => ({
          stop: i + 1,
          orderId: o.id,
          address: o.deliveryAddress,
          customerName: o.customerName,
          distanceKm: Math.round((o.distanceMeters / 1000) * 10) / 10,
          estimatedMinutes: Math.round(o.durationSeconds / 60),
        })),
      });
    } catch (error) {
      console.error("Route optimization failed:", error);
      res.status(500).json({ error: "Route optimization failed" });
    }
  });

  // Get ETA for a specific delivery using Google Maps
  app.post("/api/admin/dispatch/eta", async (req, res) => {
    try {
      const { orderId } = req.body;

      if (!hasDatabase) {
        return res.json({ eta: 20, distanceKm: 2 });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || !order.deliveryAddress) {
        return res.json({ eta: 20, distanceKm: 2 });
      }

      const restaurantAddress = "Námestie sv. Michala 1, Hlohovec, Slovakia";
      const deliveryAddress = `${order.deliveryAddress}, Hlohovec, Slovakia`;

      const matrix = await getDistanceMatrix([restaurantAddress], [deliveryAddress]);

      if (matrix && matrix[0]?.elements?.[0]) {
        const element = matrix[0].elements[0];
        const eta = Math.round(element.duration.value / 60);
        const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;

        // Update delivery task if exists
        await prisma.deliveryTask.updateMany({
          where: { orderId },
          data: { distanceKm, estimatedEta: eta },
        });

        return res.json({ eta, distanceKm, traffic: element.duration_in_traffic?.value ? Math.round(element.duration_in_traffic.value / 60) : eta });
      }

      res.json({ eta: 20, distanceKm: 2, note: "Google Maps API nedostupná, používam odhad" });
    } catch (error) {
      console.error("ETA calculation failed:", error);
      res.status(500).json({ error: "ETA calculation failed" });
    }
  });

  // Dispatch batch - assign multiple orders at once (optimized)
  app.post("/api/admin/dispatch/batch-assign", async (req, res) => {
    try {
      const { orderIds } = req.body;

      if (!hasDatabase || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Get all unassigned delivery orders
      const orders = await prisma.order.findMany({
        where: {
          id: { in: orderIds },
          courierId: null,
          status: "NEW",
          type: "DELIVERY",
        },
        orderBy: { createdAt: "asc" },
      });

      if (orders.length === 0) {
        return res.json({ success: true, assignments: [], message: "Žiadne nepriradené objednávky" });
      }

      // Get all online couriers
      const couriers = await prisma.courier.findMany({
        where: { isOnline: true },
        include: {
          orders: {
            where: { status: { in: ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] } },
            select: { id: true },
          },
        },
      });

      if (couriers.length === 0) {
        return res.json({ success: false, error: "Nie sú k dispozícii žiadni online kuriéri" });
      }

      // Simple round-robin with load balancing
      const assignments: Array<{ orderId: string; courierId: string; courierName: string }> = [];
      
      couriers.sort((a, b) => a.orders.length - b.orders.length); // Least loaded first

      for (const order of orders) {
        // Find the courier with the least active orders
        couriers.sort((a, b) => {
          const aLoad = assignments.filter((as) => as.courierId === a.id).length + a.orders.length;
          const bLoad = assignments.filter((as) => as.courierId === b.id).length + b.orders.length;
          return aLoad - bLoad;
        });

        const chosen = couriers[0];
        
        await prisma.order.update({
          where: { id: order.id },
          data: { courierId: chosen.id },
        });

        await prisma.deliveryTask.create({
          data: {
            courierId: chosen.id,
            orderId: order.id,
            distanceKm: 0,
            estimatedEta: 20,
          },
        });

        const courierUser = await prisma.user.findUnique({
          where: { id: chosen.userId },
          select: { name: true },
        });

        assignments.push({
          orderId: order.id,
          courierId: chosen.id,
          courierName: courierUser?.name || "Neznámy",
        });
      }

      res.json({
        success: true,
        assignments,
        algorithm: "Batch Dispatch v1 - Load-balanced round-robin",
      });
    } catch (error) {
      console.error("Batch dispatch failed:", error);
      res.status(500).json({ error: "Batch dispatch failed" });
    }
  });

  // Smart Batching - group orders by city/direction for optimal route
  app.post("/api/admin/dispatch/smart-batch", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json({ error: "Smart batching requires a database" });
      }

      // Get all unassigned delivery orders
      const pendingOrders = await prisma.order.findMany({
        where: {
          courierId: null,
          status: "NEW",
          type: "DELIVERY",
        },
        orderBy: { createdAt: "asc" },
      });

      if (pendingOrders.length === 0) {
        return res.json({ success: true, batches: [], message: "Žiadne nepriradené objednávky" });
      }

      // Get all online couriers with their current load
      const couriers = await prisma.courier.findMany({
        where: { isOnline: true },
        include: {
          user: {
            select: { name: true },
          },
          orders: {
            where: { status: { in: ["NEW", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] } },
            select: { id: true, deliveryCity: true },
          },
        },
      });


      if (couriers.length === 0) {
        return res.json({ success: false, error: "Nie sú k dispozícii žiadni online kuriéri" });
      }

      // Group pending orders by city
      const cityGroups: Record<string, typeof pendingOrders> = {};
      for (const order of pendingOrders) {
        const city = order.deliveryCity || "Hlohovec";
        if (!cityGroups[city]) cityGroups[city] = [];
        cityGroups[city].push(order);
      }

      // Define city clusters (same direction = same batch)
      const cityClusters: Record<string, string[]> = {
        "hlohovec": ["Hlohovec"],
        "sever": ["Šulekovo", "Koplotovce"],
        "juh": ["Leopoldov", "Červeník", "Madunice"],
      };

      // Group cities into clusters
      const clusterGroups: Record<string, typeof pendingOrders> = {};
      for (const [clusterName, cities] of Object.entries(cityClusters)) {
        for (const city of cities) {
          if (cityGroups[city]) {
            if (!clusterGroups[clusterName]) clusterGroups[clusterName] = [];
            clusterGroups[clusterName].push(...cityGroups[city]);
          }
        }
      }

      // Also add any cities not in clusters
      for (const [city, orders] of Object.entries(cityGroups)) {
        const isInCluster = Object.values(cityClusters).flat().includes(city);
        if (!isInCluster) {
          clusterGroups[city.toLowerCase()] = orders;
        }
      }

      // Create batches: assign each cluster to the best courier
      const batches: Array<{
        id: string;
        clusterName: string;
        orders: Array<{ id: string; customerName: string | null; deliveryAddress: string | null; deliveryCity: string | null; total: number }>;
        assignedCourier: { id: string; name: string; vehicleType: string } | null;
        totalDistanceKm: number;
        totalEstimatedMin: number;
        batchBonus: number;
      }> = [];

      let batchIndex = 0;
      for (const [clusterName, clusterOrders] of Object.entries(clusterGroups)) {
        if (clusterOrders.length === 0) continue;

        // Find best courier for this cluster
        const restaurantAddress = "Námestie sv. Michala 1, Hlohovec, Slovakia";
        const deliveryAddresses = clusterOrders.map((o) => `${o.deliveryAddress}, ${o.deliveryCity || "Hlohovec"}, Slovakia`);

        // Get distance matrix for ETA calculation
        const matrix = await getDistanceMatrix([restaurantAddress], deliveryAddresses);

        let totalDistanceKm = 0;
        let totalEstimatedMin = 0;

        if (matrix && matrix[0]?.elements) {
          for (const element of matrix[0].elements) {
            totalDistanceKm += (element.distance?.value || 2000) / 1000;
            totalEstimatedMin += (element.duration?.value || 900) / 60;
          }
        } else {
          // Fallback estimates
          totalDistanceKm = clusterOrders.length * 2;
          totalEstimatedMin = clusterOrders.length * 15;
        }

        // Score couriers for this cluster
        const scoredCouriers = couriers.map((c) => {
          let score = 0;
          const currentLoad = c.orders.length;

          // Prefer couriers with lower load
          score += Math.max(0, 10 - currentLoad * 3);

          // Prefer CAR for longer distances (outside Hlohovec)
          const isLongDistance = clusterName !== "hlohovec";
          if (isLongDistance && c.vehicleType === "CAR") score += 5;
          if (!isLongDistance && c.vehicleType === "BICYCLE") score += 5;

          // Prefer couriers already in this area
          const hasOrdersInArea = c.orders.some((o) => {
            const orderCity = (o as any).deliveryCity || "Hlohovec";
            return Object.values(cityClusters).flat().includes(orderCity) && 
                   cityClusters[clusterName]?.includes(orderCity);
          });
          if (hasOrdersInArea) score += 3;

          return { courier: c, score };
        });

        scoredCouriers.sort((a, b) => b.score - a.score);
        const bestCourier = scoredCouriers[0]?.courier || null;

        // Calculate batch bonus based on number of orders
        let batchBonus = 0;
        if (clusterOrders.length >= 4) batchBonus = 4;
        else if (clusterOrders.length >= 3) batchBonus = 3;
        else if (clusterOrders.length >= 2) batchBonus = 1.5;

        batches.push({
          id: `batch-${++batchIndex}`,
          clusterName: clusterName.charAt(0).toUpperCase() + clusterName.slice(1),
          orders: clusterOrders.map((o) => ({
            id: o.id,
            customerName: o.customerName,
            deliveryAddress: o.deliveryAddress,
            deliveryCity: o.deliveryCity,
            total: Number(o.total),
          })),
          assignedCourier: bestCourier ? {
            id: bestCourier.id,
            name: (bestCourier as any).user?.name || "Neznámy",
            vehicleType: bestCourier.vehicleType,
          } : null,

          totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
          totalEstimatedMin: Math.round(totalEstimatedMin),
          batchBonus,
        });
      }

      res.json({
        success: true,
        batches,
        algorithm: "Smart Batching v1 - City cluster + Nearest Neighbor",
        totalPendingOrders: pendingOrders.length,
        totalBatches: batches.length,
      });
    } catch (error) {
      console.error("Smart batching failed:", error);
      res.status(500).json({ error: "Smart batching failed" });
    }
  });

  // Assign a batch to a courier (assign all orders in batch)
  app.post("/api/admin/dispatch/assign-batch", async (req, res) => {
    try {
      const { courierId, orderIds } = req.body;

      if (!hasDatabase || !courierId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const assignments: Array<{ orderId: string; courierId: string }> = [];

      for (const orderId of orderIds) {
        await prisma.order.update({
          where: { id: orderId },
          data: { courierId },
        });

        await prisma.deliveryTask.create({
          data: {
            courierId,
            orderId,
            distanceKm: 0,
            estimatedEta: 20,
          },
        });

        assignments.push({ orderId, courierId });
      }

      res.json({
        success: true,
        assignments,
        message: `Batch priradený: ${orderIds.length} objednávok`,
      });
    } catch (error) {
      console.error("Batch assignment failed:", error);
      res.status(500).json({ error: "Batch assignment failed" });
    }
  });

  // =====================
  // Analytics & Economy Endpoints
  // =====================

  // Delivery Statistics
  app.get("/api/admin/analytics/delivery-stats", async (req, res) => {
    try {
      const orders = hasDatabase
        ? await prisma.order.findMany({
            where: { type: "DELIVERY" },
            include: { courier: true },
          })
        : fallbackOrders.filter((o: any) => o.type === "DELIVERY");

      const completed = orders.filter((o: any) => o.status === "COMPLETED");
      const totalDeliveries = completed.length;
      const totalRevenue = completed.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const totalDeliveryFees = completed.reduce((sum: number, o: any) => sum + Number(o.deliveryFee || 0), 0);
      const avgDeliveryTime = 28; // placeholder - would need real timestamps
      const avgKmPerOrder = 4.2; // placeholder - would need real distance data

      // Courier utilization
      const couriers = hasDatabase
        ? await prisma.courier.findMany({ include: { deliveryTasks: true } })
        : fallbackCouriers;

      const activeCouriers = couriers.filter((c: any) => c.isOnline).length;
      const totalCouriers = couriers.length;

      res.json({
        totalDeliveries,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalDeliveryFees: Number(totalDeliveryFees.toFixed(2)),
        avgDeliveryTime,
        avgKmPerOrder,
        activeCouriers,
        totalCouriers,
        courierUtilization: totalCouriers > 0 ? Math.round((activeCouriers / totalCouriers) * 100) : 0,
        costPerDelivery: totalDeliveries > 0 ? Number((totalDeliveryFees / totalDeliveries).toFixed(2)) : 0,
        revenuePerDelivery: totalDeliveries > 0 ? Number((totalRevenue / totalDeliveries).toFixed(2)) : 0,
      });
    } catch (error) {
      console.error("Delivery stats error:", error);
      res.status(500).json({ error: "Failed to fetch delivery stats" });
    }
  });

  // Peak Hour Analytics
  app.get("/api/admin/analytics/peak-hours", async (req, res) => {
    try {
      const orders = hasDatabase
        ? await prisma.order.findMany({ where: { status: "COMPLETED" } })
        : fallbackOrders.filter((o: any) => o.status === "COMPLETED");

      // Group orders by hour
      const hourlyData: Record<number, { count: number; revenue: number }> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { count: 0, revenue: 0 };
      }

      orders.forEach((o: any) => {
        const hour = new Date(o.createdAt).getHours();
        if (hourlyData[hour]) {
          hourlyData[hour].count++;
          hourlyData[hour].revenue += Number(o.total);
        }
      });

      const peakHours = Object.entries(hourlyData)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          ...data,
          revenue: Number(data.revenue.toFixed(2)),
        }))
        .sort((a, b) => b.count - a.count);

      // Top 3 peak hours
      const topPeakHours = peakHours.slice(0, 3);

      // Peak vs non-peak comparison
      const peakOrders = orders.filter((o: any) => {
        const hour = new Date(o.createdAt).getHours();
        return (hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20);
      });
      const nonPeakOrders = orders.filter((o: any) => {
        const hour = new Date(o.createdAt).getHours();
        return !((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20));
      });

      res.json({
        hourlyBreakdown: peakHours,
        topPeakHours,
        peakHourStats: {
          orders: peakOrders.length,
          revenue: Number(peakOrders.reduce((s: number, o: any) => s + Number(o.total), 0).toFixed(2)),
          percentage: orders.length > 0 ? Math.round((peakOrders.length / orders.length) * 100) : 0,
        },
        nonPeakStats: {
          orders: nonPeakOrders.length,
          revenue: Number(nonPeakOrders.reduce((s: number, o: any) => s + Number(o.total), 0).toFixed(2)),
          percentage: orders.length > 0 ? Math.round((nonPeakOrders.length / orders.length) * 100) : 0,
        },
      });
    } catch (error) {
      console.error("Peak hours analytics error:", error);
      res.status(500).json({ error: "Failed to fetch peak hour analytics" });
    }
  });

  // Profitability Metrics
  app.get("/api/admin/analytics/profitability", async (req, res) => {
    try {
      const orders = hasDatabase
        ? await prisma.order.findMany({ where: { type: "DELIVERY", status: "COMPLETED" } })
        : fallbackOrders.filter((o: any) => o.type === "DELIVERY" && o.status === "COMPLETED");

      const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const totalDeliveryFees = orders.reduce((sum: number, o: any) => sum + Number(o.deliveryFee || 0), 0);
      const totalOrders = orders.length;

      // Estimate costs
      const avgFoodCost = totalRevenue * 0.35; // 35% food cost
      const avgLaborCost = totalRevenue * 0.25; // 25% labor cost
      const deliveryCost = totalDeliveryFees * 1.2; // 20% overhead on delivery fees
      const platformFee = totalRevenue * 0.20; // What Wolt/Bolt would charge (20%)

      const totalCost = avgFoodCost + avgLaborCost + deliveryCost;
      const netProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Comparison with marketplace platforms
      const marketplaceFee = totalRevenue * 0.25; // 25% marketplace fee
      const marketplaceNet = totalRevenue - avgFoodCost - avgLaborCost - marketplaceFee;
      const marketplaceMargin = totalRevenue > 0 ? (marketplaceNet / totalRevenue) * 100 : 0;

      const savingsVsMarketplace = marketplaceFee - deliveryCost;

      res.json({
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
        costBreakdown: {
          foodCost: Number(avgFoodCost.toFixed(2)),
          foodCostPercentage: 35,
          laborCost: Number(avgLaborCost.toFixed(2)),
          laborCostPercentage: 25,
          deliveryCost: Number(deliveryCost.toFixed(2)),
          deliveryCostPercentage: totalRevenue > 0 ? Number(((deliveryCost / totalRevenue) * 100).toFixed(1)) : 0,
        },
        profitability: {
          netProfit: Number(netProfit.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(1)),
          totalCost: Number(totalCost.toFixed(2)),
        },
        marketplaceComparison: {
          marketplaceFee: Number(marketplaceFee.toFixed(2)),
          marketplaceFeePercentage: 25,
          marketplaceNetProfit: Number(marketplaceNet.toFixed(2)),
          marketplaceMargin: Number(marketplaceMargin.toFixed(1)),
          savingsVsMarketplace: Number(savingsVsMarketplace.toFixed(2)),
          savingsPercentage: totalRevenue > 0 ? Number(((savingsVsMarketplace / totalRevenue) * 100).toFixed(1)) : 0,
        },
        deliveryEfficiency: {
          costPerDelivery: totalOrders > 0 ? Number((deliveryCost / totalOrders).toFixed(2)) : 0,
          deliveryCostPercentageOfRevenue: totalRevenue > 0 ? Number(((deliveryCost / totalRevenue) * 100).toFixed(1)) : 0,
          targetPercentage: "5-12%",
        },
      });
    } catch (error) {
      console.error("Profitability analytics error:", error);
      res.status(500).json({ error: "Failed to fetch profitability metrics" });
    }
  });

  // -- ADMIN COUPON MANAGEMENT --

  // Get all coupons
  app.get("/api/admin/coupons", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.json([]);
      }
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  // Create coupon
  app.post("/api/admin/coupons", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.status(400).json({ error: "Database required" });
      }
      const { code, discount, type, minOrder, expiresAt } = req.body;
      
      if (!code || discount === undefined) {
        return res.status(400).json({ error: "Kód a zľava sú povinné" });
      }

      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        return res.status(400).json({ error: "Kupón s týmto kódom už existuje" });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discount: Number(discount),
          type: type || "FIXED",
          minOrder: minOrder ? Number(minOrder) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }
      });
      res.status(201).json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  // Delete coupon
  app.delete("/api/admin/coupons/:id", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.status(400).json({ error: "Database required" });
      }
      await prisma.coupon.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  // Toggle coupon active status
  app.patch("/api/admin/coupons/:id/toggle", async (req, res) => {
    try {
      if (!hasDatabase) {
        return res.status(400).json({ error: "Database required" });
      }
      const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
      if (!coupon) {
        return res.status(404).json({ error: "Kupón nenájdený" });
      }
      const updated = await prisma.coupon.update({
        where: { id: req.params.id },
        data: { isActive: !coupon.isActive }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle coupon" });
    }
  });

  // Vite middleware for development
  if (!serveClient) {
    return app;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT || 3000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
