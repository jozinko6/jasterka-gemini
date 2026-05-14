import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      const { type, items, total, deliveryFee, deliveryAddress, customerEmail, couponCode } = req.body;

      // Calculate points to award (1 point for each 1 EUR)
      const pointsToAward = Math.floor(total);

      const order = await prisma.order.create({
        data: {
          type: type === "delivery" ? "DELIVERY" : "PICKUP",
          total,
          deliveryFee: deliveryFee || 0,
          deliveryAddress,
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
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
      const menu = await prisma.dailyMenu.findFirst({
        orderBy: { date: "desc" }
      });
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily menu" });
    }
  });

  // Update Daily Menu (Admin)
  app.post("/api/admin/daily-menu", async (req, res) => {
    try {
      const { content, date } = req.body;
      const normalizedDate = new Date(date || new Date().toISOString().split('T')[0]);
      normalizedDate.setHours(0, 0, 0, 0);

      const menu = await prisma.dailyMenu.upsert({
        where: { date: normalizedDate },
        update: { content },
        create: { 
          content, 
          date: normalizedDate
        }
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
