# Implementation Plan - Jašterka Hlohovec

## Fáza 0: Stabilizácia (Hotové)
- [x] Inicializácia dokumentácie.
- [x] Stabilizácia buildu a prostredia.

## Fáza 1: Homepage UI Shell (Hotové)
- [x] Moderný Hero banner.
- [x] Responsive Layout a navigácia.
- [x] Info bar (lokalita, kontakt, čas).
- [x] Placeholder sekcie pre menu a info.

## Fáza 2: Menu UI (Hotové)
- [x] Layout pre kategórie (Pizza, Denné menu, atď.).
- [x] MenuItem komponenty.

## Fáza 3: Prisma Schema (Hotové)
- [x] Definícia entít (User, Category, MenuItem, Order, atď.).
- [x] Príprava migrácií (Schéma verifikovaná).
- [x] Generovanie Prisma klienta.

## Fáza 4: Seed Data & Service Layer (Hotové)
- [x] Vytvorenie `seed.ts` pre základné menu a admina.
- [x] Implementácia základných CRUD služieb (`menuService`).

## Fáza 5: Cart System (Hotové)
- [x] Implementácia Zustand store pre košík.
- [x] Pridanie interaktivity k tlačidlám "Pridať do košíka".
- [x] Vytvorenie košíkového draweru (prehľad a úprava položiek).

## Fáza 6: Checkout System (Hotové)
- [x] Formulár pre výber Pickup / Delivery.
- [x] Validácia adresy a výber času doručenia.

## Fáza 7: Admin Dashboard (Hotové)
- [x] Prihlasovanie admina (Zatiaľ prepínanie pohľadu).
- [x] Správa objednávok (Mock dáta, pripravené na Service Layer).

## Fáza 8: Real-time Updates & API (Hotové)
- [x] Prepojenie Checkoutu s API.
- [x] Implementácia API endpointov pre spracovanie objednávok.

## Fáza 9: Order Status Management (Hotové)
- [x] Zmena stavu objednávky v Admin Dashboard.
- [x] Push notifikácie/Polling pre klienta o zmene stavu.

## Fáza 10: Štatistiky & Vylepšenia (Hotové)
- [x] Implementácia grafov do Admin Dashboardu (Recharts).
- [x] SSE pre okamžité notifikácie nových objednávok.

## Fáza 11: Bezpečnosť & Produkcia (Hotové)
- [x] Implementácia reálneho prihlasovania pre admina.
- [x] Ochrana Admin Dashboardu stavom autentifikácie.

## Fáza 12: Správa Ponuky (Hotové)
- [x] CRUD operácie pre kategórie a jedlá.
- [x] UI pre nahrávanie obrázkov (URL).

## Fáza 13: Admin UX vylepšenia (Hotové)
- [x] Zvukové notifikácie pri novej objednávke.
- [x] Tlač objednávky (Print-friendly view).
- [x] Filter objednávok podľa dňa/stavu.

## Fáza 14: Mapy & Logistika (Hotové)
- [x] Integrácia Google Maps pre vizualizáciu adries doručenia.
- [x] Výpočet vzdialenosti a odhadu času doručenia (V Admin Logistike).

## Fáza 15: Vernostný Program & Customer UX (Hotové)
- [x] Implementácia zákazníckych účtov (Loyalty Email-based).
- [x] Systém vernostných bodov za nákupy.
- [x] Kupóny a zľavy v košíku.

## Fáza 16: Rezervačný Systém (Hotové)
- [x] Formulár pre online rezerváciu stola.
- [x] Správa rezervácií v Admin Dashboarde.
- [ ] Emailové notifikácie o potvrdení (V nasledujúcej fáze).

## Fáza 17: Rozšírené Nastavenia a CMS (Hotové)
- [x] Správa prevádzkových hodín cez admin panel.
- [x] Správa kontaktných údajov a adries.
- [x] Úprava textov na úvodnej stránke (Hero sekcia).
- [x] Integrácia CMS dát do frontend aplikácie.

## Fáza 18: Kompletná Ponuka & Rozšírený CRUD (Hotové)
- [x] Import plnej ponuky pizze, štanglí a príloh podľa zadania.
- [x] Implementácia "Full CRUD" (Pridávanie, Úprava, Mazanie jedál).
- [x] Podpora pre alergény a kategorizáciu (Pizza flag).
- [x] Sync mechanizmus pre menu v Admin nastaveniach.

## Fáza 19: Emailové Notifikácie (Nasledujúca)
- [ ] Integrácia s Resend/SendGrid.
- [ ] Automatické emaily pre nové objednávky.
- [ ] Potvrdenie rezervácie zákazníkovi.
