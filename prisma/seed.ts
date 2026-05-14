import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Categories
  const pizzaCat = await prisma.category.upsert({
    where: { slug: 'pizza' },
    update: {},
    create: { name: 'Pizza', slug: 'pizza', order: 1 },
  });

  const pizzaStangleCat = await prisma.category.upsert({
    where: { slug: 'pizza-stangle' },
    update: {},
    create: { name: 'Pizza štangle', slug: 'pizza-stangle', order: 2 },
  });

  const focaccioCat = await prisma.category.upsert({
    where: { slug: 'focaccio' },
    update: {},
    create: { name: 'Focaccio', slug: 'focaccio', order: 3 },
  });

  const polievkyCat = await prisma.category.upsert({
    where: { slug: 'polievky' },
    update: {},
    create: { name: 'Polievky', slug: 'polievky', order: 4 },
  });

  const hydinaCat = await prisma.category.upsert({
    where: { slug: 'hydina' },
    update: {},
    create: { name: 'Jedlá z hydiny', slug: 'hydina', order: 5 },
  });

  const hovadzieCat = await prisma.category.upsert({
    where: { slug: 'hovadzie' },
    update: {},
    create: { name: 'Jedlá z hovädzieho mäsa', slug: 'hovadzie', order: 6 },
  });

  const bravcoveCat = await prisma.category.upsert({
    where: { slug: 'bravcove' },
    update: {},
    create: { name: 'Jedlá z bravčového mäsa', slug: 'bravcove', order: 7 },
  });

  const specialityCat = await prisma.category.upsert({
    where: { slug: 'speciality' },
    update: {},
    create: { name: 'Špeciality podniku', slug: 'speciality', order: 8 },
  });

  const misyCat = await prisma.category.upsert({
    where: { slug: 'misy' },
    update: {},
    create: { name: 'Misy pre 2 osoby', slug: 'misy', order: 9 },
  });

  const syryCat = await prisma.category.upsert({
    where: { slug: 'syry' },
    update: {},
    create: { name: 'Syrové špeciality', slug: 'syry', order: 10 },
  });

  const bezmasiteCat = await prisma.category.upsert({
    where: { slug: 'bezmasite' },
    update: {},
    create: { name: 'Bezmäsité jedlá', slug: 'bezmasite', order: 11 },
  });

  const salatyCat = await prisma.category.upsert({
    where: { slug: 'salaty' },
    update: {},
    create: { name: 'Šaláty', slug: 'salaty', order: 12 },
  });

  const medzinarodnaCat = await prisma.category.upsert({
    where: { slug: 'medzinarodna' },
    update: {},
    create: { name: 'Medzinárodná kuchyňa', slug: 'medzinarodna', order: 13 },
  });

  const mucneCat = await prisma.category.upsert({
    where: { slug: 'mucne' },
    update: {},
    create: { name: 'Múčne jedlá', slug: 'mucne', order: 14 },
  });

  const prilohyCat = await prisma.category.upsert({
    where: { slug: 'prilohy' },
    update: {},
    create: { name: 'Prílohy', slug: 'prilohy', order: 15 },
  });

  const salatovePrilohyCat = await prisma.category.upsert({
    where: { slug: 'salatove-prilohy' },
    update: {},
    create: { name: 'Šalátové prílohy', slug: 'salatove-prilohy', order: 16 },
  });

  // 2. Menu Items
  const items = [
    // PIZZAS
    { name: '1. Margerita', description: 'Pomodoro, bazalka, syr', price: 7.20, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?q=80&w=2070' },
    { name: '2. Šunková', description: 'Pomodoro, šunka, syr', price: 7.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070' },
    { name: '3. Salámová', description: 'Pomodoro, salám, syr', price: 7.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=2080' },
    { name: '4. Šampiňónová', description: 'Pomodoro, šunka, šampiňóny, syr', price: 7.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=2050' },
    { name: '5. Študentská', description: 'Pomodoro, šunka, kukurica, syr', price: 7.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981' },
    { name: '6. Hawai', description: 'Pomodoro, šunka, ananás, syr', price: 7.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=2050' },
    { name: '7. Quatro Formaggi', description: 'Pomodoro, 4 druhy syra (niva, údený syr, mozarella, eidam)', price: 9.00, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070' },
    { name: '8. Provinciále', description: 'Pomodoro, šunka, kukurica, šampiňóny, feferóny, slanina, syr', price: 8.40, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '9. Gazdovská', description: 'Pomodoro, salám, klobása, slanina, cibuľa, feferóny, syr', price: 8.80, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '10. Diavola', description: 'Pomodoro, šunka, pikantný salám, chilli, paprika, syr', price: 8.30, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1935' },
    { name: '11. Pikante', description: 'Pomodoro, pikantný salám, chilli, cibuľa, syr', price: 8.30, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1935' },
    { name: '12. Vegetariánska', description: 'Pomodoro, šampiňóny, kukurica, brokolica, paradajky, olivy, syr', price: 8.50, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=2050' },
    { name: '13. Špek', description: 'Pomodoro, šunka, kukurica, slanina, tavený syr, syr', price: 8.40, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981' },
    { name: '14. Talianská', description: 'Pomodoro, paradajky, prosciutto, rucola, parmezán, syr', price: 9.50, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?q=80&w=2070' },
    { name: '15. Tuniaková', description: 'Pomodoro, tuniak, cibuľa, olivy, syr', price: 8.40, categoryId: pizzaCat.id, isPizza: true, allergens: '1,4,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '16. Hermelínová', description: 'Pomodoro, šunka, hermelín, syr, brusnicová omáčka', price: 8.60, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070' },
    { name: '17. Jašterka', description: 'Pomodoro, kuracie mäso, niva, hermelín, rucola, syr, sweet chilli omáčka', price: 9.90, categoryId: pizzaCat.id, isPizza: true, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },

    // PIZZA STANGLE
    { name: '1. Pizza štangle s dresingom', description: '250g', price: 4.50, categoryId: pizzaStangleCat.id, allergens: '1,3,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '2. Pizza štangle syrové', description: 'Pomodoro, syr, 450g', price: 7.20, categoryId: pizzaStangleCat.id, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '3. Pizza štangle šunkové', description: 'Pomodoro, šunka, syr, 470g', price: 7.40, categoryId: pizzaStangleCat.id, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '4. Pizza štangle slaninové', description: 'Pomodoro, slanina, údený syr, 470g', price: 7.80, categoryId: pizzaStangleCat.id, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '5. Pizza štangle nivové', description: 'Pomodoro, slanina, niva, 470g', price: 8.00, categoryId: pizzaStangleCat.id, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '6. Pizza štangle gazdovské', description: 'Pomodoro, slanina, klobása, kukurica, syr, 500g', price: 8.60, categoryId: pizzaStangleCat.id, allergens: '1,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },

    // FOCACCIO
    { name: '1. Focaccio s kuracím mäsom', description: 'Dresing, zelenina, kuracie mäso, 2ks 500g', price: 8.20, categoryId: focaccioCat.id, allergens: '1,3,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },
    { name: '2. Focaccio s prosciuttom', description: 'Dresing, šalát, mozzarella, prosciutto, 2ks 480g', price: 9.30, categoryId: focaccioCat.id, allergens: '1,3,7', image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974' },

    // POLIEVKY
    { name: 'Hráškový krém s krutónmi', description: '0,33l', price: 3.50, categoryId: polievkyCat.id, allergens: 'obilniny, mlieko', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071' },
    { name: 'Tekvicová Hokaido s krutónmi', description: '0,33l', price: 3.50, categoryId: polievkyCat.id, allergens: 'obilniny, mlieko', image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1974' },

    // HYDINA
    { name: 'Černohorský kurací rezeň', description: '150g | zemiakové cestíčko', price: 9.50, categoryId: hydinaCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070' },
    { name: 'Prsia v strúhanke', description: '150g', price: 8.00, categoryId: hydinaCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=2073' },
    { name: 'Prsia v cestíčku', description: '150g', price: 8.00, categoryId: hydinaCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1626202341507-af883968688c?q=80&w=1287' },
    { name: 'Zapekané prsia s ananásom', description: '150g | šunka, syr, ananás', price: 8.50, categoryId: hydinaCat.id, allergens: 'obilniny', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1913' },
    { name: 'Prsia s nivovou omáčkou', description: '150g', price: 8.50, categoryId: hydinaCat.id, allergens: 'mlieko', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1913' },
    { name: 'Plnené prsia', description: '150g | šunka, syr', price: 9.50, categoryId: hydinaCat.id, allergens: 'obilniny, vajcia, mlieko', image: 'https://images.unsplash.com/photo-1598103442097-8b74304b25ec?q=80&w=1976' },

    // HOVADZIE
    { name: 'Sviečkové medailónky', description: '200g | 3 ks', price: 12.00, categoryId: hovadzieCat.id, allergens: 'obilniny, horčica', image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?q=80&w=1287' },
    { name: 'Hovädzí steak s jemnou omáčkou', description: '200g | Omáčky: nivová, syrová, dubáková, zo zeleného korenia', price: 19.50, categoryId: hovadzieCat.id, allergens: 'obilniny, mlieko', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069' },
    { name: 'Sviečková "Stroganov"', description: '200g | uhorka sterilizovaná, šampiňóny, smotana, horčica', price: 13.00, categoryId: hovadzieCat.id, allergens: 'mlieko, horčica', image: 'https://images.unsplash.com/photo-1534939561126-755ecf1588b0?q=80&w=1287' },

    // BRAVCOVE
    { name: 'Slovenský zákusok – vyprážaný rezeň', description: '150g', price: 8.50, categoryId: bravcoveCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070' },
    { name: 'Bačovský rezeň', description: '150g | šunka, syr, slanina', price: 9.50, categoryId: bravcoveCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070' },
    { name: 'Cigánska po našom s cesnakom', description: '150g', price: 8.50, categoryId: bravcoveCat.id, allergens: 'obilniny, horčica', image: 'https://images.unsplash.com/photo-1532057705423-f254181f5c6b?q=80&w=2076' },
    { name: 'Černohorský rezeň', description: '150g | zemiakové cestíčko', price: 9.50, categoryId: bravcoveCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070' },
    { name: 'Bravčové medailónky s plackami', description: '150g | 3 ks medailónky z bravčovej panenky + 3 ks placka', price: 9.50, categoryId: bravcoveCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1532057705423-f254181f5c6b?q=80&w=2076' },

    // SPECIALITY
    { name: 'Rezeň JAŠTERKA XXL', description: '200g | Výber: kurací rezeň v cestíčku / kurací rezeň v zemiakovom cestíčku / vyprážaný bravčový rezeň', price: 10.50, categoryId: specialityCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1626240213988-c75c8751f7bb?q=80&w=2070' },
    { name: 'Chrumkavý kurací rezeň', description: '150g | kuracie prsia, cornflexy', price: 9.00, categoryId: specialityCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=2073' },
    { name: 'Kačacie prsia so slivkovo – smotanovou omáčkou', description: '200g', price: 13.50, categoryId: specialityCat.id, allergens: 'mlieko', image: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?q=80&w=1287' },
    { name: 'Kuracie medailónky s plackami a syrovou omáčkou', description: '150g', price: 9.50, categoryId: specialityCat.id, allergens: 'obilniny, mlieko', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=2073' },

    // MISY
    { name: 'Misa pre 2 osoby BRAVČOVO – KURACIA', description: '200g bravčová cigánska, 200g bravčová špecialita, 200g kuracie prsia v cestíčku, 200g hranolky, 200g dusená ryža, 2x šalát', price: 33.00, categoryId: misyCat.id, allergens: 'obilniny, vajcia, mlieko, horčica', image: 'https://images.unsplash.com/photo-1544124499-58912cbddadf?q=80&w=1287' },

    // SYRY
    { name: 'Vyprážaný syr (Eidam)', description: '100g', price: 6.00, categoryId: syryCat.id, allergens: 'obilniny, vajcia, mlieko', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=2069' },
    { name: 'Grilovaný Encián s brusnicami', description: '120g', price: 6.00, categoryId: syryCat.id, allergens: 'mlieko', image: 'https://images.unsplash.com/photo-1626240213988-c75c8751f7bb?q=80&w=2070' },

    // BEZMASITE
    { name: 'Vyprážané šampiňóny', description: '200g', price: 7.50, categoryId: bezmasiteCat.id, allergens: 'obilniny, vajcia', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=2050' },

    // SALATY
    { name: 'Kráľovský šalát', description: '350g | ľadový šalát, rajčina, uhorka, paprika, opražené šampiňóny, chrumkavá slaninka, strúhaný syr, dresing', price: 8.00, categoryId: salatyCat.id, allergens: 'mlieko', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070' },
    { name: 'Šalát Cézar', description: '350g | Ľadový šalát, rajčina, uhorka, paprika, 150g opekané kuracie prsia, slaninka, šampiňóny, posypané syrom a krutónmi', price: 8.50, categoryId: salatyCat.id, allergens: 'obilniny, mlieko', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=2070' },

    // MEDZINARODNA
    { name: 'Mexické bravčové soté', description: '150g | mexická zelenina, chilli, kečup', price: 8.50, categoryId: medzinarodnaCat.id, image: 'https://images.unsplash.com/photo-1544124499-58912cbddadf?q=80&w=1287' },

    // MUCNE (DESSERTS)
    { name: 'Palacinky s džemom', description: '2 ks, šľahačka, čokoláda, 170g', price: 6.00, categoryId: mucneCat.id, allergens: 'obilniny, vajcia, mlieko', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=1980' },
    { name: 'Vafle Jašterka', description: '170g | 3 ks vafle, lesná zmes, vanilková zmrzlina, šľahačka', price: 6.00, categoryId: mucneCat.id, allergens: 'obilniny, vajcia, mlieko, orechy', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=1980' },

    // PRILOHY (SIDES)
    { name: 'Americké zemiaky', description: '200g', price: 2.50, categoryId: prilohyCat.id },
    { name: 'Hranolky', description: '200g', price: 2.50, categoryId: prilohyCat.id },
    { name: 'Dusená ryža', description: '150g', price: 2.50, categoryId: prilohyCat.id },

    // SALATOVE PRILOHY
    { name: 'Kapustový šalát', description: '150g', price: 2.50, categoryId: salatovePrilohyCat.id },
    { name: 'Sezónny letný šalát', description: '150g', price: 2.50, categoryId: salatovePrilohyCat.id },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: `item-${item.name.replace(/\s+/g, '-').toLowerCase()}` }, // Use a stable ID for upsert or just create
      update: item,
      create: {
        ...item,
        id: `item-${item.name.replace(/\s+/g, '-').toLowerCase()}`
      }
    } as any);
  }

  // 3. Coupons
  const coupons = [
    {
      code: 'JASTERKA10',
      discount: 10,
      type: 'PERCENT',
      minOrder: 20
    },
    {
      code: 'VITAJTE',
      discount: 5,
      type: 'FIXED',
      minOrder: 15
    }
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon as any
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
