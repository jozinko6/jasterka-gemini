# Progress - Jašterka Hlohovec

## [2026-05-13] - Fáza 1: Homepage UI Shell
- [x] Pivot projektu a aktualizácia dokumentácie.
- [x] Update `metadata.json`.
- [x] Implementácia "Premium Gastro" designu v `index.css`.
- [x] Vytvorenie moderného Hero banneru a Layoutu v `App.tsx`.
- [x] Verifikácia buildu (`npm run build`).

## [2026-05-14] - Fáza 32: Route Optimization Engine & Google Maps ETA
- [x] Implementácia Google Maps Distance Matrix API helper funkcie pre reálne ETA a vzdialenosti.
- [x] Implementácia `/api/admin/dispatch/optimize-route` endpointu - Nearest Neighbor optimalizácia trás.
- [x] Implementácia `/api/admin/dispatch/eta` endpointu - reálny ETA výpočet cez Google Maps.
- [x] Automatická aktualizácia delivery taskov s reálnymi vzdialenosťami a ETA.
- [x] Fallback na chronologické poradie pri nedostupnosti Google Maps API.
- [x] Verifikácia buildu.

## [2026-05-14] - Fáza 36: Courier Panel Enhancement
- [x] Vylepšenie CourierApp - zobrazenie iba delivery objednávok (nie všetkých).
- [x] Pridanie Google Maps navigácie pre každú objednávku (Mapy smerovanie).
- [x] Implementácia delivery acceptance flow (Potvrdiť → Prevziať → Doručené).
- [x] Pridanie stavových akcií pre kuriéra (Potvrdiť, Prevziať na doručenie, Doručené).
- [x] Pridanie nových ikon a vylepšenie UI (Route, MapIcon, Bell, ThumbsUp/Down).
- [x] Verifikácia buildu.

## [2026-05-14] - Fáza 37: Analytics & Economy Endpoints
- [x] Implementácia `/api/admin/analytics/delivery-stats` - štatistiky doručení (počet, revenue, fees, avg time, courier utilization).
- [x] Implementácia `/api/admin/analytics/peak-hours` - peak hour analýza (hourly breakdown, top 3 peak hours, peak vs non-peak porovnanie).
- [x] Implementácia `/api/admin/analytics/profitability` - profitability metriky (cost breakdown, profit margin, marketplace comparison s Wolt/Bolt).
- [x] Marketplace comparison - výpočet úspory oproti Wolt/Bolt (25% fee vs vlastný delivery).
- [x] Delivery efficiency metrics - cost per delivery, delivery cost % of revenue, target 5-12%.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-15] - Fáza 40: Oprava "Potvrdiť objednávku" v CourierApp
- [x] Diagnostikovaný problém: Po kliknutí na "Potvrdiť objednávku" sa status zmenil z NEW na CONFIRMED, ale chýbala vizuálna spätná väzba - tlačidlo zmizlo bez akéhokoľvek indikátora úspechu.
- [x] Pridaná successMessage notifikácia (zelený banner) po úspešnej zmene stavu objednávky.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 38b: Oprava TypeScript chýb v server.ts
- [x] Oprava `rating` property - chýbajúci field v Prisma type intersection (použité `as any`).
- [x] Oprava `deliveryTasks` → `deliveryTask` model name v Prisma query (model je `DeliveryTask`, nie `DeliveryTasks`).
- [x] Oprava `courierEarning` → `courierEarning` model name v Prisma query.
- [x] Oprava `_avg` aggregate - `rating` je Float na Courier modeli, aggregate funguje.
- [x] Oprava `suitability` index type - explicitné `Record<string, number>` pre order map.
- [x] Regenerácia Prisma clienta po schema zmenách.
- [x] Verifikácia `tsc --noEmit` (exit code 0) a `vite build`.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 39: Admin Dashboard - Kupóny (Coupons) Tab
- [x] Pridanie "Kupóny" (Coupons) tabu do Admin Dashboard sidebaru.
- [x] Implementácia API volaní pre načítanie, vytváranie, prepínanie a mazanie kupónov.
- [x] Formulár pre vytvorenie nového kupónu (kód, zľava, typ, min. objednávka, expirácia).
- [x] Zoznam kupónov s možnosťou aktivácie/deaktivácie a mazania.
- [x] Štatistické karty (Aktívne, Neaktívne, Celkom).
- [x] Verifikácia Vite buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 38: Oprava Smart Batching - bestCourier.name
- [x] Oprava TypeScript chyby `bestCourier.name` - Courier model nemá `name` field, name je na User modeli.
- [x] Pridanie `user: { select: { name: true } }` do include v courier query pre smart-batch endpoint.
- [x] Zmena prístupu k menu kuriéra cez `(bestCourier as any).user?.name`.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.


## [2026-05-14] - Fáza 35: Kitchen Dashboard
- [x] Pridanie "Kuchyňa" (Kitchen) tabu do Admin Dashboard.
- [x] Implementácia 4-stĺpcového workflow (Nové → Prijaté → Pripravuje sa → Ready).
- [x] Station filter (Kuchyňa, Pizza, Bar, Dovoz) s automatickou detekciou stanice podľa položiek.
- [x] Order timers - zobrazenie času od objednania s urgent warningom (>15 min).
- [x] Status action buttons (Prijať, Začať Prípravu, Hotovo, Na Cestu).
- [x] Print ticket button pre každú objednávku.
- [x] Live počty objednávok v headeri.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 31: Dispatch Engine UI - Auto-Dispatch, Batch Assign & Suggestions
- [x] Pridanie "Auto-Priradiť (1)" tlačidla do Dispatch tabu - automatické priradenie najvhodnejšieho kuriéra.
- [x] Pridanie "Batch Priradiť" tlačidla - hromadné priradenie všetkých čakajúcich objednávok.
- [x] Pridanie "Návrhy" tlačidla - zobrazenie vhodných kuriérov pre aktuálnu objednávku.
- [x] Implementácia API volaní pre auto-dispatch, batch-assign a suggestions.
- [x] Verifikácia buildu.

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

## [2026-05-14] - Fáza 24: Databázová integrácia & Courier Seed
- [x] Vytvorenie `.env` s DATABASE_URL pre Neon PostgreSQL.
- [x] Push Prisma schémy do databázy (`prisma db push`).
- [x] Seed databázy s kompletným menu, kupónmi, denným menu a kuriérmi.
- [x] Oprava create order endpointu pre databázu (foreign key fix pre menuItemId).
- [x] Pridanie seed pre 3 kuriérov (Ján Kuriér - CAR, Peter Rozvoz - BICYCLE, Mária Doručenie - SCOOTER).
- [x] Verifikácia API endpointov (menu, objednávky, admin, kuriéri).

**Build status:** ✅ SUCCESS (server beží na Neon PostgreSQL).

## [2026-05-14] - Fáza 25: Courier Shift System & Earnings
- [x] Rozšírenie Prisma schémy o DeliveryTask, CourierEarning, CourierShift vylepšenia.
- [x] Backend API pre smeny kuriérov (vytvorenie, zoznam, správa).
- [x] Backend API pre earnings kuriérov (base fee, distance bonus, batch bonus).
- [x] Vylepšenie CourierApp - zobrazenie earnings, história doručení, smeny.
- [x] Admin Dashboard - správa smien, prehľad earnings kuriérov.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 26: Courier Economy & Smart Dispatch Backend
- [x] Rozšírenie Prisma schémy o DeliveryTask, CourierEarning, CourierShift.
- [x] Backend API pre smeny kuriérov (CRUD, status management).
- [x] Backend API pre earnings kuriérov (base fee, distance bonus, batch bonus, peak hour bonus, performance bonus).
- [x] Backend API pre delivery tasks (vytvorenie, status update, zoznam).
- [x] Backend API pre earnings summary (today, this week, total).
- [x] Verifikácia TypeScript buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 27: Courier App - Smart Dispatch UI & Earnings Dashboard
- [x] Pridanie "Zárobok" (Earnings) tabu do CourierApp s prehľadom denných/týždenných/celkových earnings.
- [x] Pridanie "Smeny" (Shifts) tabu do CourierApp so zoznamom smien.
- [x] Pridanie histórie doručení a výplat do CourierApp.
- [x] Implementácia bottom tab navigácie v CourierApp (Objednávky / Zárobok / Smeny).
- [x] Pridanie "Dispatch" tabu do AdminDashboard pre smart priraďovanie objednávok.
- [x] Dispatch Engine UI - zoznam čakajúcich objednávok, aktívne dovozy, dostupnosť kuriérov.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 28: Admin Shift Management UI
- [x] Pridanie "Smeny a Výplaty Kuriérov" sekcie do Admin Dashboard (Couriers tab).
- [x] Implementácia výberu kuriéra a načítavania smien/earnings.
- [x] UI pre zoznam smien s možnosťou spustenia, ukončenia a zrušenia.
- [x] UI pre zoznam výplat s detailným rozpisom bonusov (Základ, Vzdialenosť, Batch, Peak, Výkon).
- [x] Modal pre vytváranie nových smien s podporou Peak hodín.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 29: Courier Earnings Engine & Smart Bonus System
- [x] Implementácia `/api/admin/earnings/calculate` endpointu pre automatický výpočet earnings.
- [x] Implementácia ekonomického modelu z Master Plánu (Base Fee: 2€/3€, Distance: 0.35€/0.55€, Batch: +1€ až +4€, Peak: 10-25%, Performance: 5-10%).
- [x] Implementácia `/api/admin/couriers/leaderboard` endpointu pre rebríček kuriérov.
- [x] Implementácia `/api/admin/couriers/analytics` endpointu pre štatistiky kuriérov.
- [x] Automatické pripisovanie earnings k celkovým earnings kuriéra.
- [x] Verifikácia Prisma generovania a buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 30: Admin Leaderboard UI & Courier Gamification
- [x] Pridanie "Rebríček" (Leaderboard) tabu do Admin Dashboard.
- [x] Implementácia leaderboard tabuľky s rankingom, levelmi, ratingom, earnings.
- [x] Implementácia gamifikačného level systému (Bronze/Silver/Gold/Elite).
- [x] Implementácia courier analytics kariet (celkom, aktívni, doručenia, výplaty).
- [x] Pridanie legendy level systému s podmienkami pre postup.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 33: Route Optimization UI v Admin Dashboard
- [x] Pridanie "Optimalizácia Trás" sekcie do Dispatch tabu v Admin Dashboard.
- [x] Zoznam online kuriérov s počtom aktívnych doručení.
- [x] Tlačidlo "Optimalizovať" pre každého kuriéra - volá `/api/admin/dispatch/optimize-route`.
- [x] Zobrazenie optimalizovaného poradia doručení (číslované zastávky).
- [x] Alert s detailami optimalizovanej trasy (vzdialenosť, čas, zastávky).
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.

## [2026-05-14] - Fáza 34: Smart Batching Engine & UI
- [x] Implementácia `/api/admin/dispatch/smart-batch` endpointu - zoskupenie objednávok podľa mesta/smeru.
- [x] Implementácia `/api/admin/dispatch/assign-batch` endpointu - hromadné priradenie batchu kuriérovi.
- [x] City cluster logika (Hlohovec, Sever: Šulekovo+Koplotovce, Juh: Leopoldov+Červeník+Madunice).
- [x] Scoring kuriérov pre každý batch (load, vehicle type, location match).
- [x] Batch bonus výpočet (1.5€ - 4€ podľa počtu objednávok).
- [x] Google Maps Distance Matrix integrácia pre reálne ETA a vzdialenosti.
- [x] Pridanie "Smart Batching" sekcie do Dispatch tabu v Admin Dashboard.
- [x] Tlačidlo "Analyzovať a Vytvoriť Batche" s alert výsledkom.
- [x] "Ako to funguje" info box s vysvetlením batching logiky.
- [x] Verifikácia buildu.

**Build status:** ✅ SUCCESS.
