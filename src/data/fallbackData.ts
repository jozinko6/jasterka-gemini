export interface FallbackMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  tag?: string | null;
  isPizza?: boolean;
  isActive?: boolean;
  allergens?: string | null;
}

export interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  items: FallbackMenuItem[];
}

const pizzaImage = "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070";
const foodImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080";

export const fallbackCategories: FallbackCategory[] = [
  {
    id: "cat-pizza",
    name: "Pizza",
    slug: "pizza",
    order: 1,
    items: [
      { id: "pizza-margerita", name: "1. Margerita", description: "Pomodoro, bazalka, syr", price: 7.2, image: pizzaImage, categoryId: "cat-pizza", isPizza: true, isActive: true, allergens: "1,7" },
      { id: "pizza-sunkova", name: "2. Sunkova", description: "Pomodoro, sunka, syr", price: 7.9, image: pizzaImage, categoryId: "cat-pizza", isPizza: true, isActive: true, allergens: "1,7" },
      { id: "pizza-salamova", name: "3. Salamova", description: "Pomodoro, salama, syr", price: 7.9, image: pizzaImage, categoryId: "cat-pizza", isPizza: true, isActive: true, allergens: "1,7" },
      { id: "pizza-quattro", name: "7. Quattro Formaggi", description: "Pomodoro, styri druhy syra", price: 9.0, image: pizzaImage, categoryId: "cat-pizza", isPizza: true, isActive: true, allergens: "1,7" },
      { id: "pizza-jasterka", name: "17. Jasterka", description: "Pomodoro, kuracie maso, niva, hermelin, rucola, syr, sweet chilli omacka", price: 9.9, image: pizzaImage, categoryId: "cat-pizza", isPizza: true, isActive: true, tag: "Specialita", allergens: "1,7" },
    ],
  },
  {
    id: "cat-stangle",
    name: "Pizza stangle",
    slug: "pizza-stangle",
    order: 2,
    items: [
      { id: "stangle-dresing", name: "Pizza stangle s dresingom", description: "250g", price: 4.5, image: pizzaImage, categoryId: "cat-stangle", isActive: true, allergens: "1,3,7" },
      { id: "stangle-syrove", name: "Pizza stangle syrove", description: "Pomodoro, syr, 450g", price: 7.2, image: pizzaImage, categoryId: "cat-stangle", isActive: true, allergens: "1,7" },
    ],
  },
  {
    id: "cat-polievky",
    name: "Polievky",
    slug: "polievky",
    order: 3,
    items: [
      { id: "polievka-vyvar", name: "Slepaci vyvar s rezancami", description: "0,33l", price: 3.5, image: foodImage, categoryId: "cat-polievky", isActive: true, allergens: "1,3,9" },
      { id: "polievka-krem", name: "Hraškovy krem s krutonmi", description: "0,33l", price: 3.5, image: foodImage, categoryId: "cat-polievky", isActive: true, allergens: "1,7" },
    ],
  },
  {
    id: "cat-hydina",
    name: "Jedla z hydiny",
    slug: "hydina",
    order: 4,
    items: [
      { id: "hydina-cernohor", name: "Cernohorsky kuraci rezen", description: "150g, zemiakove cesticko", price: 9.5, image: foodImage, categoryId: "cat-hydina", isActive: true, allergens: "1,3" },
      { id: "hydina-niva", name: "Prsia s nivovou omackou", description: "150g", price: 8.5, image: foodImage, categoryId: "cat-hydina", isActive: true, allergens: "7" },
    ],
  },
  {
    id: "cat-salaty",
    name: "Salaty",
    slug: "salaty",
    order: 5,
    items: [
      { id: "salat-cezar", name: "Salat Cezar", description: "350g, kuracie prsia, slaninka, krutony, syr", price: 8.5, image: foodImage, categoryId: "cat-salaty", isActive: true, allergens: "1,7" },
      { id: "salat-jasterka", name: "Salat Jasterka", description: "350g, kuracie nugetky v cornflakesoch", price: 8.5, image: foodImage, categoryId: "cat-salaty", isActive: true, allergens: "1,3" },
    ],
  },
];

export let fallbackDailyMenu = {
  id: "daily-default",
  date: new Date().toISOString(),
  content: [
    "Denne menu 7,50 EUR",
    "",
    "Polievka:",
    "- Slepaci vyvar s rezancami",
    "- Fazuľova so zeleninou",
  ].join("\n"),
  items: [
    {
      id: "daily-1",
      name: "Vyprazany kuraci rezen",
      description: "Zemiakova kasa, kysla uhorka",
      price: 7.5,
      order: 1,
      isActive: true,
    },
    {
      id: "daily-2",
      name: "Bravcovy perkelt",
      description: "Maslove halusky",
      price: 7.5,
      order: 2,
      isActive: true,
    },
    {
      id: "daily-3",
      name: "Salat s grilovanym ostiepkom",
      description: "Brusnicovy dressing",
      price: 7.5,
      order: 3,
      isActive: true,
    },
  ],
};

export const fallbackSettings: Record<string, string> = {
  restaurant_name: "Jašterka",
  address: "Hlohovec, Slovensko",
  contact_phone: "0949 401 505",
  contact_email: "info@jasterka.sk",
  opening_hours: "Po - Ne: 10:00 - 22:00",
};

export function setFallbackDailyMenu(content: string, date: string, items = fallbackDailyMenu.items) {
  fallbackDailyMenu = {
    id: "daily-default",
    date: new Date(date).toISOString(),
    content,
    items,
  };
}

// Courier fallback data
export interface FallbackCourier {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  isOnline: boolean;
  activeOrdersCount: number;
}

export let fallbackCouriers: FallbackCourier[] = [
  { id: "courier-1", name: "Ján Kuriér", phone: "0900 111 222", vehicleType: "CAR", isOnline: true, activeOrdersCount: 0 },
  { id: "courier-2", name: "Peter Doručovateľ", phone: "0900 333 444", vehicleType: "SCOOTER", isOnline: true, activeOrdersCount: 0 },
  { id: "courier-3", name: "Mária Rýchla", phone: "0900 555 666", vehicleType: "BICYCLE", isOnline: false, activeOrdersCount: 0 },
];
