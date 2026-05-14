# Project
Reštaurácia Jašterka Hlohovec - Moderný gastro ekosystém.

# Tech Stack
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React (Icons)
- Framer Motion (Animations)
- Zustand (State management)
- Prisma (Database)

# Hlavné pravidlá

### 1. Nerob veľké refactory
- Neprepisuj fungujúce súbory bez dôvodu.
- Nerob cleanup mimo scope.
- Nerob reorganizáciu priečinkov.

### 2. Pracuj po malých krokoch
Každý prompt = jedna úloha.
Po každom kroku over build.

### 3. Po každom kroku over build
Vždy spusti `npm run build` alebo `compile_applet` po signifikantných zmenách.

### 4. Design pravidlá
- Používaj tému "Premium Gastro".
- Paleta: Olivová zelená, tmavozelená, krémová, béžová, oranžová (CTA).
- Vyhýbaj sa generickým gradientom.

# Workflow
Pred každou implementáciou:
1. prečítaj docs/*
2. aktualizuj PROGRESS.md
3. implementuj iba jednu fázu
4. over build
5. zastav sa
