# Sprint 8 — Dashboard, historique, métriques corporelles & photos

> **Périmètre (plan §13)** : « Dashboard, historique, métriques corporelles, photos ».
> Découpé en **5 étapes indépendantes**, chacune dimensionnée pour tenir dans une
> fenêtre de contexte courte et se lancer dans **sa propre session**. À la fin de chaque
> étape : `tsc` front+back = 0 erreur (+ build Vite pour les étapes UI) → feu vert
> utilisateur → commit + push sur `main` → l'utilisateur teste via `update` LXC. Puis on
> ouvre une nouvelle session avec le prompt de l'étape suivante.

## Conventions communes (rappel, identiques au Sprint 7)
- React18+Vite+TS strict / Tailwind (display=Orbitron, pixel=Press Start 2P, xp=or `#f59e0b`, primary=indigo `#6366f1`) / Zustand / **recharts déjà installé**. Backend Express+Prisma+PostgreSQL port 3001, API `/api/v1`. **multer déjà installé** côté backend.
- Couleurs en `rgba()` explicite (les modificateurs d'opacité Tailwind `/80` cassent avec les CSS custom props). Code couleur validé : XP/poids = or, durée = cyan, transition = violet.
- Pas de Postgres dans le shell → vérif visuelle des pages auth-gated via **sonde DEV temporaire dans `main.tsx`** (`?dev&…` → monter React DANS le `.then()` de l'import du store sinon ProtectedRoute redirige) + preview `fitquest-frontend` (Vite 5173). **Retirer la sonde avant commit.** Pour un rendu pixel/canvas, possibilité de générer un PNG hors-app via script Node jetable (cf. 7E).
- `lib/xp.ts`, `lib/badges.ts` existent en **double miroir** front/back — garder synchro.
- Schéma : `model BodyMetric` (date, weightKg, waistCm, chestCm, bicepCm, thighCm, customMetrics Json) et `model BodyPhoto` (date, type, filePath, note) **existent déjà** (cf. `backend/prisma/schema.prisma` ~L249/262) + relations `User.bodyMetrics`/`bodyPhotos`. Pas de Postgres local → migrations via `prisma db push` (les scripts LXC le font).
- **Badges = source de vérité `backend/src/lib/badges.ts`** (cf. 7C) ; 2 badges du plan §9 restent à brancher : **Sculpteur** (10 métriques enregistrées) et **Photographe** (5 photos importées).
- Mémoire projet : `~/.claude/projects/D--Projects-DevClaude-FitQuest/memory/fitquest_project.md`. **La lire en début de chaque session**, la mettre à jour en fin d'étape.
- État de départ : Dashboard a déjà (Sprint 6) la section « Activité récente » (`WorkoutHistory limit=5`) + StatCard « Séances ». L'historique de séances (`components/workout/WorkoutHistory.tsx`) existe. Il n'y a **pas encore** de page « Corps », ni d'entrée de nav, ni de composants `body/`/`stats/`, ni de dossier `uploads/`.

---

## Étape 8A — Métriques corporelles : backend + API
**Modèle conseillé : Sonnet** (CRUD Prisma + détection badge ; pas d'UI).

**À faire :**
1. Route `backend/src/routes/body.ts` montée sur `/api/v1/body`, protégée `requireAuth` :
   - `GET /metrics` — liste des `BodyMetric` de l'user, triées par `date` desc.
   - `POST /metrics` — création (weightKg/waistCm/chestCm/bicepCm/thighCm tous optionnels + `customMetrics` `[{name,value,unit}]`). Valider qu'au moins un champ est renseigné.
   - `PATCH /metrics/:id` / `DELETE /metrics/:id` — vérifier l'appartenance à l'user.
2. **Badge « Sculpteur »** (10 métriques enregistrées) : l'ajouter au catalogue `lib/badges.ts` (rareté à décider — `rare` proposé, `iconType` existant ou nouveau, ex. réutiliser `crystal`/`star`) + brancher la détection dans `detectBadges` (compter les `BodyMetric` de l'user) et la déclencher après `POST /metrics`. Renvoyer `newBadges` dans la réponse (pour l'animation déjà branchée via `GlobalBadgeUnlock`).
3. `badgeProgress()` : ajouter la progression « x/10 métriques ».

**À décider en début de session** : rareté + icône du badge Sculpteur ; faut-il borner le nombre de métriques custom.

**Livrable** : route `body.ts` (metrics), badge Sculpteur branché, tsc back vert. (UI = 8B.)

---

## Étape 8B — Métriques corporelles : page « Corps » + graphiques
**Modèle conseillé : Sonnet** (UI form + recharts).

**À faire :**
1. **Nouvelle page `pages/Body.tsx`** (route `/body`) avec onglets **Métriques** / **Photos** (Photos = squelette « bientôt », rempli en 8D).
2. **Entrée de nav « Corps »** : `AppLayout` (sidebar) + `BottomNav` + i18n `nav.body`/`navShort.body`. ⚠️ La nav passe à **6 entrées** → vérifier que la barre mobile tient (sinon arbitrer quoi regrouper — à décider avec l'user).
3. **Onglet Métriques** :
   - Formulaire de saisie (réutiliser `NumberStepper`) : poids + mensurations + ajout de champs custom `{name,value,unit}`.
   - Liste chronologique des relevés (édition/suppression).
   - **Graphiques recharts** : courbe de poids dans le temps + courbes mensurations (sélecteur de métrique), couleur or pour le poids. Gérer l'état vide.
4. `stores/bodyStore.ts` (Zustand) : `fetchMetrics`/`addMetric`/`updateMetric`/`deleteMetric`, file de badges via `enqueueUnlocks` (cf. `badgeStore`).

**À décider** : layout des onglets + jeu de mensurations affichées par défaut + comment présenter les champs custom dans les graphes.

**Livrable** : page Corps + onglet Métriques fonctionnel (saisie + graphes), tsc front + build Vite verts.

---

## Étape 8C — Photos de progression : backend (upload + stockage)
**Modèle conseillé : Sonnet** (multer + volume Docker + détection badge).

**À faire :**
1. **Upload multer** : config stockage disque vers `backend/uploads/` (chemin configurable env `UPLOAD_DIR`, défaut `/app/uploads` en conteneur), nom de fichier unique, filtre type image + limite de taille. **Jamais de base64 en BDD** (cf. plan §contraintes) — on stocke `filePath`.
2. Routes sur `/api/v1/body/photos` (`requireAuth`) :
   - `POST /photos` — upload (champ fichier + `type` full/front/back/side/arm/leg/other + `note?`), crée `BodyPhoto`.
   - `GET /photos` — liste triée par date.
   - `DELETE /photos/:id` — supprime l'entrée **et le fichier disque**, vérifier l'appartenance.
   - Servir les fichiers : route statique protégée `/api/v1/body/photos/file/:id` (ou static express sur `/uploads` — décider ; protéger l'accès aux photos d'autrui).
3. **Persistance LXC** : ajouter le **volume `uploads`** au `docker-compose.yml` (dev + prod) pour le service backend, et s'assurer que `ct/fitquest.sh`/`update.sh` ne l'effacent pas au rebuild. Mettre à jour `.env.example` (`UPLOAD_DIR`).
4. **Badge « Photographe »** (5 photos importées) : catalogue `lib/badges.ts` + détection (compter `BodyPhoto`) déclenchée après `POST /photos`, `newBadges` en réponse + `badgeProgress`.

**À décider** : stratégie de service des fichiers (static vs route protégée) + limite de taille/format + faut-il générer une miniature.

**Livrable** : upload + CRUD photos + volume Docker + badge Photographe, tsc back vert. (UI = 8D.)

---

## Étape 8D — Photos de progression : galerie + comparaison
**Modèle conseillé : Sonnet** (UI upload + galerie + comparateur).

**À faire :**
1. **Onglet Photos** de `pages/Body.tsx` :
   - Import d'une photo (sélecteur de fichier + choix de la **zone/type** + note), preview avant envoi.
   - **Galerie** groupée par zone, vignettes triées par date, suppression.
2. **Comparaison avant/après** : sélection de 2 photos (même zone idéalement) en **side-by-side** ou slider, avec dates/écart de poids si dispo.
3. `bodyStore` étendu (`fetchPhotos`/`uploadPhoto`/`deletePhoto`), gestion `multipart/form-data`, file de badges.
4. Esthétique RPG cohérente (cards border glow, état vide « Immortalise ta progression »).

**À décider** : comparateur slider vs side-by-side (proposer 2 maquettes) + faut-il un mode plein écran.

**Livrable** : onglet Photos complet (import + galerie + comparaison), tsc front + build Vite verts.

---

## Étape 8E — Dashboard enrichi + historique dédié
**Modèle conseillé : Sonnet** (UI + recharts ; **Opus** si on rebrasse la hiérarchie du Dashboard en profondeur).

**À faire :**
1. **Dashboard** (`pages/Dashboard.tsx`, déjà partiellement fait au Sprint 6) :
   - **Streak animé** (flamme/compteur), **card « prochaine séance »** (résolue depuis les programmes), feed d'activité (existe).
   - **Graphique fréquence hebdomadaire** (recharts, ~3 mois) à partir de l'historique de séances.
   - **Résumé métriques corporelles** : dernier poids + mini-courbe (consomme 8A/8B).
2. **Historique dédié** : page ou section au-delà du `limit=5` actuel — liste complète avec **filtres** (par programme / période), réutiliser `WorkoutHistory`.
3. Veiller à la cohérence responsive (mobile/desktop) et aux états vides.

**À décider** : historique en page à part (nouvelle route) vs section extensible du Dashboard ; contenu exact des cards du Dashboard (proposer une hiérarchie).

**Livrable** : Dashboard enrichi + historique filtrable, tsc front + build Vite verts. **Clôt le Sprint 8.**

---

## Ordre & dépendances
`8A (métriques back)` → `8B (métriques UI)` dépend de 8A.
`8C (photos back)` → `8D (photos UI)` dépend de 8C.
`8E (dashboard/historique)` en dernier — consomme les métriques (8A/8B) pour le résumé.
8A/8C sont indépendants entre eux ; on peut faire 8A→8B puis 8C→8D, ou intercaler. **Recommandé : 8A → 8B → 8C → 8D → 8E.**
