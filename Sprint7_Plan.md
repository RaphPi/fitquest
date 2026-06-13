# Sprint 7 — Gamification (XP étagé, niveaux, badges, avatar)

> Découpage en **5 étapes indépendantes**, chacune dimensionnée pour tenir dans une
> fenêtre de contexte raisonnable et se lancer dans **sa propre session**. À la fin de
> chaque étape : `tsc` front+back = 0 erreur → feu vert utilisateur → commit + push sur
> `main` → l'utilisateur teste via `update` LXC. Puis on ouvre une nouvelle session avec
> le prompt de l'étape suivante.
>
> **Décision de cadrage actée : la boutique d'XP est ABANDONNÉE** (pas de dépense d'XP).
> L'`xpBalance` reste au schéma mais n'est pas exploité au Sprint 7.

## Conventions communes à toutes les étapes
- React18+Vite+TS strict / Tailwind (display=Orbitron, pixel=Press Start 2P, xp=or `#f59e0b`, primary=indigo `#6366f1`) / Zustand. Backend Express+Prisma+PostgreSQL port 3001, API `/api/v1`.
- Couleurs combat validées en `rgba()` explicite (les modificateurs d'opacité Tailwind `/80` cassent avec les CSS custom props).
- Pas de Postgres dans le shell → vérif visuelle d'une page auth-gated via sonde DEV temporaire dans `main.tsx` (`?dev` → `useUserStore.setState({isAuthenticated:true, user:{…}})`) + preview `fitquest-frontend` (Vite 5173, dans `.claude/launch.json`). **Retirer la sonde avant commit.**
- `lib/xp.ts` existe en **double miroir** front (`frontend/src/lib/xp.ts`) et back (`backend/src/lib/xp.ts`) — garder synchro.
- Mémoire projet : `~/.claude/projects/D--Projects-DevClaude-FitQuest/memory/fitquest_project.md`. **La lire en début de chaque session**, la mettre à jour en fin d'étape.

---

## Étape 7A — Économie d'XP & courbe de niveaux
**Modèle conseillé : Sonnet** (logique + maths + sync front/back ; passer en **Opus** si on veut vraiment rebrasser la courbe en profondeur / brainstormer les coefficients).

**Problème à corriger** : aujourd'hui `1 rép = 1 pt` et `1 s = 1 pt` (SECONDS_PER_POINT=3 ne concerne QUE les PV du boss, pas l'XP). L'XP finale ne distingue pas reps vs durée → le gainage peut dominer. La courbe `level*150` est linéaire.

**À faire :**
1. Définir des **coefficients d'effort/XP distincts** reps vs durée (ex. `XP_PER_REP`, `XP_PER_SEC` calibrés pour qu'une minute de gainage ≈ une série de reps, pas plus). Centraliser dans `lib/xp.ts` (front+back).
2. Revoir `computeWorkoutXp` pour pondérer par type d'exercice (pas la durée brute).
3. **Nouvelle courbe de niveaux** (remplacer `level*150`) : progressive (ex. quadratique douce ou paliers), gratifiante tôt, sans plafonner trop vite. Documenter la formule + une table niveau→XP cumulé (≈ L1→L50) dans ce fichier.
4. Garder `applyXp` (montées multi-niveaux) cohérent avec la nouvelle courbe.
5. Pas d'UI lourde ici (sauf vérifier que XPBar/Dashboard affichent toujours bien le `xpRequired`).

**À décider en début de session avec l'utilisateur** : forme exacte de la courbe + valeurs des coefficients (proposer 2-3 options chiffrées avec une table comparative).

**Livrable** : `lib/xp.ts` front+back synchro, table de niveaux documentée, tsc vert.

---

## Étape 7B — Couleurs par niveau (paliers visuels)
**Modèle conseillé : Haiku** (petit, visuel, bien cadré ; Sonnet si on ajoute des effets).

**À faire :**
1. Définir des **paliers de couleur par niveau** (ex. Bronze 1-9, Argent 10-19, Or 20-34, Émeraude 35-49, Diamant/Mythique 50+ — à valider). Helper `lib/levelTier.ts` : `level → { name, color, glow }`.
2. Appliquer aux composants existants : `LevelBadge` (bordure/texte/glow selon palier), `XPBar` (gradient de la jauge selon palier), header mobile + sidebar.
3. Rester en `rgba()` explicite. Cohérence avec le thème `data-theme`.

**Livrable** : `lib/levelTier.ts`, `LevelBadge`/`XPBar` colorés par palier, vérif visuelle (sonde DEV à plusieurs niveaux), tsc vert.

---

## Étape 7C — Badges : modèle de données, backend & détection
**Modèle conseillé : Sonnet** (schéma Prisma + logique de détection multi-déclencheurs ; **Opus** en ouverture si on brainstorme le catalogue en profondeur).

> Le schéma a déjà `model Badge` + `model UserBadge` (cf. `backend/prisma/schema.prisma` ~L165/272). Vérifier/compléter.

**À faire :**
1. **Catalogue de badges** (figer la liste + conditions). Base de départ (plan §9) : Premier pas, Régularité (7j), Semaine parfaite (5 séances/7j), Centurion (100 séances), Sans excuses (30 séances poids du corps), Architecte (1er programme custom), Montée en puissance (niv 10), Légende (niv 50). Ajouter rareté (commun/rare/épique/légendaire) + icône RPG (coffre/coupe/médaille/artéfact).
2. **Seed** des badges (`backend/prisma/` + miroir racine si nécessaire).
3. **Moteur de détection** : à la soumission de séance (`routes/workouts.ts`) et autres déclencheurs (level-up, création programme), évaluer les conditions et créer les `UserBadge` manquants. Renvoyer les badges nouvellement débloqués dans la réponse (pour l'animation 7D).
4. **API** : `GET /api/v1/badges` (catalogue + état obtenu/locked pour l'user), inclusion dans `/me` ou route dédiée.

**À décider en début de session avec l'utilisateur** : liste finale des badges + raretés + représentation visuelle (brainstorm — c'est le gros morceau).

**Livrable** : schéma/seed badges, détection branchée, API, tsc back vert. (UI = 7D.)

---

## Étape 7D — Badges : vitrine + déblocage animé
**Modèle conseillé : Sonnet** (UI + animations).

**À faire :**
1. **Vitrine des trophées** (Profil ou section dédiée) : grille de badges par rareté, obtenus en couleur + locked grisés/silhouette, tooltip « comment l'obtenir » (condition lisible) + progression si quantifiable (ex. 42/100 séances).
2. **Déblocage animé** en fin de séance : réutiliser l'esprit du `LevelUpBurst` (rayons, particules, son via `lib/sound.ts` → ajouter un son `badge`), bannière « Badge débloqué : … ». Enchaîner proprement avec le level-up s'il y en a un.
3. Brancher sur les `newBadges` renvoyés par l'API (7C).

**Livrable** : composant vitrine + animation de déblocage, intégrés au flux fin de séance et au Profil, vérif visuelle, tsc vert.

---

## Étape 7E — Avatar évolutif
**Modèle conseillé : Opus** (direction artistique SVG + progression ; Sonnet si on se contente de réutiliser/teinter les silhouettes existantes).

> `avatarStage Int` existe déjà au schéma User. 4 silhouettes SVG existent (warrior/archer/mage/knight, créées au Sprint 2).

**À faire :**
1. Définir la **progression visuelle de l'avatar** par stade (ex. 6 stades liés aux paliers de niveau de 7B) : équipement/aura qui s'enrichit, pas forcément 6 dessins from scratch — variations programmatiques (teinte palier, accessoires, glow) sur la silhouette choisie, dans l'esprit des skins boss pixel.
2. Calcul `avatarStage` dérivé du niveau (ou du palier 7B) côté back, persisté.
3. **Affichage** : Profil (grand avatar + stade + prochain palier), Dashboard/header (miniature). Animation d'évolution quand on franchit un palier (réutiliser les helpers d'effets existants).

**À décider en début de session avec l'utilisateur** : direction artistique (réutiliser les 4 silhouettes + variations vs nouveaux assets) + mapping stade↔niveau.

**Livrable** : système d'avatar évolutif (assets/variations + logique stade + affichage + animation), tsc vert. **Clôt le Sprint 7.**

---

## Ordre & dépendances
`7A (XP/niveaux)` → `7B (couleurs palier)` dépend du concept de palier → `7C (badges back)` → `7D (badges UI)` dépend de 7C → `7E (avatar)` peut réutiliser les paliers de 7B.
Les étapes 7C/7D forment une paire (back puis front) ; 7A/7B et 7E sont relativement autonomes.
