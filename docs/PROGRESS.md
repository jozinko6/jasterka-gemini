# Progress - Jašterka Hlohovec

## [2026-05-13] - Fáza 1: Homepage UI Shell
- [x] Pivot projektu a aktualizácia dokumentácie.
- [x] Update `metadata.json`.
- [x] Implementácia "Premium Gastro" designu v `index.css`.
- [x] Vytvorenie moderného Hero banneru a Layoutu v `App.tsx`.
- [x] Verifikácia buildu (`npm run build`).

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 2: Menu UI
- [x] Implementácia layoutu pre kategórie (Pizza, Denné menu, atď.).
- [x] Vytvorenie MenuItem komponentov s "Premium Gastro" štýlom.
- [x] Pridanie hover animácií a "Pridať do košíka" CTA.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 3: Prisma Schema
- [x] Inštalácia Prisma a @prisma/client (v5 pre stabilitu).
- [x] Definícia komplexnej databázovej schémy v `prisma/schema.prisma`.
- [x] Verifikácia schémy (`npx prisma validate`).
- [x] Generovanie Prisma klienta.
- [x] Aktualizácia `.env.example` a `DATABASE_PLAN.md`.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 4: Seed Data & Service Layer
- [x] Vytvorenie zdieľaného Prisma klienta v `src/lib/prisma.ts`.
- [x] Implementácia `prisma/seed.ts` s testovacími dátami.
- [x] Vytvorenie `src/services/menuService.ts`.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 5: Cart System
- [x] Inštalácia Zustand pre state management.
- [x] Implementácia `useCartStore` s funkciami pridávania, odstraňovania a zmeny množstva.
- [x] Vytvorenie animovaného `CartDrawer` komponentu.
- [x] Prepojenie UI tlačidiel "Pridať do košíka" s globálnym storom.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 6: Checkout System
- [x] Implementácia Checkout overlay-u.
- [x] Prepínanie medzi Osobným odberom a Rozvozom s dynamickou cenou.
- [x] Formulár pre údaje zákazníka s podmienenými poľami.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 7: Admin Dashboard (Základ)
- [x] Vytvorenie `AdminDashboard.tsx` s prehľadom objednávok.
- [x] Implementácia prepínania pohľadov (Client vs Admin).
- [x] Pridanie footeru s prístupom pre administrátora.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 8: Real-time API Backend
- [x] Implementácia `server.ts` s Express + Vite Middleware.
- [x] Vytvorenie API endpointov pre Menu a Objednávky.
- [x] Prepojenie frontend Checkoutu s backend API.
- [x] Integrácia Admin Dashboardu s reálnymi dátami z databázy.
- [x] Verifikácia buildu a reštart dev servera.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 10: Štatistiky & SSE Notifikácie
- [x] Inštalácia `recharts` pre vizualizáciu dát.
- [x] Implementácia SSE (Server-Sent Events) pre live objednávky.
- [x] Prepojenie Admin Dashboardu s reálnym SSE streamom.
- [x] Pridanie interaktívnych grafov (Obrat a Popularita) do Stats tabu.
- [x] Verifikácia buildu a reštart servera.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 11: Bezpečnosť & Admin Auth
- [x] Vytvorenie komponentu `AdminLogin.tsx` s prémiovým dizajnom.
- [x] Implementácia API endpointu `/api/admin/login` pre overenie hesla.
- [x] Zabezpečenie prístupu k Admin Dashboardu pomocou autentifikácie.
- [x] Pridanie `.env.example` pre konfiguráciu administrátorského hesla.

**Build status:** ✅ SUCCESS.

## [2026-05-13] - Fáza 12: Správa Ponuky (CRUD)
- [x] Implementácia API endpointov pre vytváranie a mazanie jedál.
- [x] Vytvorenie UI pre správu menu v Admin Dashboarde.
- [x] Implementácia `MenuItemModal` pre pridávanie nových položiek.
- [x] Podpora pre soft-delete položiek v menu.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 13: Admin UX vylepšenia
- [x] Zvukové notifikácie pri novej objednávke (SSE integrácia).
- [x] Filtrovanie objednávok podľa stavu a typu v Admin Dashboard.
- [x] Implementácia tlače objednávky (Print-friendly view).
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 14: Mapy & Logistika
- [x] Integrácia Google Maps do klientskej zóny (sledovanie objednávky).
- [x] Implementácia logistickej mapy v Admin Dashboarde.
- [x] Výpočet trasy a vizualizácia dovozu pre admina.
- [x] Verifikácia buildu a Vite konfigurácie.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 15: Vernostný Program & Customer UX
- [x] Rozšírenie Prisma schémy o Loyalitu a Kupóny.
- [x] Backend logika pre udeľovanie bodov (1€ = 1 bod).
- [x] API pre validáciu kupónov a prehľad vernostného konta.
- [x] UI komponent pre "Môj účet / Vernostné body".
- [x] Implementácia uplatňovania kupónov v pokladni.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 16: Rezervačný Systém
- [x] Rozšírenie Prisma schémy o model Reservation.
- [x] Backend API pre rezervácie (create, status update).
- [x] Zákaznícky formulár na webe.
- [x] Admin dashboard tab pre správu a potvrdzovanie rezervácií.
- [x] Presun Maps konfigurácie do Admin nastavení.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 17: Rozšírené Nastavenia a CMS
- [x] Backend API pre key-value nastavenia.
- [x] Admin formuláre pre správu obsahu (Otváracie hodiny, kontakt, Hero texty).
- [x] Dynamické načítavanie nastavení na klientskej časti.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 18: Kompletná Ponuka & Rozšírený CRUD
- [x] Aktualizácia menu o kompletný zoznam (Pizze, Polievky, Mäso, Špeciality, Misy, Saláty, Dezerty, Prílohy).
- [x] Implementácia "Full CRUD" pre jedlá (Pridávanie, Úprava, Mazanie).
- [x] Pridanie podpory pre alergény a typy jedál (Pizza flag).
- [x] Implementácia núdzového "Sync Menu" mechanizmu v Admin nastaveniach.
- [x] Pridanie informačných prvkov o pizze (cesnakové okraje, základ) na web.
- [x] Verifikácia buildu a integrity dát.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 19: Denné Menu & CMS Rozšírenie
- [x] Implementácia backendu pre Denné Menu (Weekly structure).
- [x] Vytvorenie admin rozhrania pre správu denného menu.
- [x] Zobrazenie denného menu na hlavnej stránke.
- [x] Formátovanie obsahu pomocou textového formátu s podporou whitespace.

## [2026-05-14] - Fáza 17-19: Stabilizácia a CMS Integrácia
- [x] Dokončenie CMS integrácie (dynamické zobrazenie nastavení v App.tsx).
- [x] Pridanie sekcie "O nás" (History section) s CMS správou.
- [x] Experimentálna oprava chyby `window.fetch` (zmena APIProvider verzie).
- [x] Kompletná ponuka jedál (Pizze 1-17, Hydina, Hovädzie, Bravčové, Špeciality).
- [x] Oprava linting chýb (Prisma schema synchronizácia, React importy).
- [x] Verifikácia buildu.

## [2026-05-14] - Fáza 20: SEO & PWA Podpora
- [x] Implementácia SEO meta tagov a OpenGraph pre sociálne siete.
- [x] Vytvorenie `manifest.json` pre PWA (inštalovateľná aplikácia).
- [x] Aktualizácia meta dát aplikácie v `metadata.json`.
- [x] Pridanie Apple Touch Icon a témy pre mobilné prehliadače.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 21: Opravy a dotiahnutie detailov
- [x] Oprava nefunkčného tlačidla "Zobraziť Celú Ponuku" (pridaný chýbajúci handler).
- [x] Verifikácia navigácie a build statusu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 22: Mobile App Experience & Navigácia
- [x] Rozšírenie navigácie o priame odkazy (Pizza, Ponuka).
- [x] Implementácia mobilnej spodnej navigačnej lišty (Bottom Nav).
- [x] Optimalizácia dotykových cieľov pre mobilnú verziu.
- [x] Integrácia aktívnej kategórie "Pizza" priamo z menu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 23: Bezpečnosť a prístupy
- [x] Aktualizácia admin hesla na `jasterka2024`.
- [x] Reštart produkčného prostredia.

**Build status:** ✅ SUCCESS.

## Ďalší krok
- Implementácia Fázy 24: Emailové Notifikácie a integrácia služieb.
