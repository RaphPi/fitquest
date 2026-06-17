# FitQuest — Plan Projet Complet v3
> Document de référence pour Claude Code — version finale

---

## 1. Vision

**FitQuest** est une web app de renforcement musculaire gamifiée, pensée pour les débutants qui ont besoin de motivation visuelle autant que sportive. Interface style RPG, progression visible, plaisir d'utilisation quotidien.

**Principes directeurs :**
- Zéro friction : lancer une séance en moins de 10 secondes
- Plaisir visuel avant tout : UI RPG soignée, thème personnalisable
- Progressivité : ne jamais intimider, toujours encourager
- Évolutivité : architecture modulaire, chaque feature est un bloc indépendant
- Self-hosted : déploiement Docker en une commande sur infra perso

---

## 2. Identité Visuelle

### Logo
- **Icône** : Épée dans un bouclier, lame large biseautée à reflets métalliques, garde dorée, poignée bois, pommel elliptique "LVL"
- **Typographie** : "FIT" (weight 200, letter-spacing 4, blanc) + "QUEST" (weight 800, violet #a78bfa)
- **Tagline** : "LEVEL UP !" (9-10px, indigo #6366f1, letter-spacing 6.5)
- Fichier SVG source : `frontend/src/assets/logo/fitquest-logo.svg`

### Palette (thème Void RPG — défaut)
| Rôle | Valeur |
|---|---|
| Fond principal | `#0a0a0f` |
| Fond carte | `#0f1117` |
| Fond bouclier/icône | `#0d0b1e` |
| Bordure | `#1e2030` |
| Accent principal | `#6366f1` (indigo) |
| Accent violet clair | `#a78bfa` |
| Or / XP | `#f59e0b` |
| Succès | `#22c55e` |
| Danger | `#ef4444` |
| Texte principal | `#f1f5f9` |
| Texte secondaire | `#64748b` |

### Thèmes supplémentaires (débloquables)
- **Forest Warrior** : fond `#0D1F0F`, accent `#22C55E`
- **Solar Blaze** : fond `#1A0F00`, accent `#F59E0B`

### Typographie
- Display RPG : Orbitron ou Rajdhani (titres, niveaux, stats)
- Corps : Inter (texte courant)
- Données/chiffres : Orbitron

---

## 3. Architecture Globale

### Déploiement
```
Proxmox Host
└── Docker Container : FitQuest
    ├── Frontend   : React/Vite (Nginx)
    ├── Backend    : Node.js/Express (API REST)
    ├── Base de données : PostgreSQL
    └── Stockage   : Volume Docker (photos, images exercices)

Optionnel (autre machine réseau) :
└── Ollama / LM Studio  ← connecteur configurable via URL
```

### Stack technique
```
Frontend :    React 18 + Vite + TypeScript
Style :       TailwindCSS + shadcn/ui
État :        Zustand
Routing :     React Router v6
i18n :        react-i18next (FR + EN)

Backend :     Node.js + Express
BDD :         PostgreSQL + Prisma ORM
Auth :        JWT (httpOnly cookie) + bcrypt
Fichiers :    Volume Docker (photos, images exercices)

IA :          Architecture multi-provider (voir section dédiée)
PDF export :  Puppeteer (HTML → PDF)
Notifications: Webhook générique + FreeSMS + Home Assistant
```

### Script de déploiement (esprit Proxmox Helper Scripts)
```bash
# Installation en une commande
bash <(curl -s https://raw.githubusercontent.com/[user]/fitquest/main/install.sh)

# Mise à jour
bash <(curl -s https://raw.githubusercontent.com/[user]/fitquest/main/update.sh)
```

`install.sh` : vérifie Docker, clone le repo, génère `.env`, lance `docker compose up -d`, affiche l'URL.

---

## 4. Structure des Dossiers
```
fitquest/
├── docker-compose.yml
├── install.sh
├── update.sh
├── .env.example
├── frontend/
│   └── src/
│       ├── assets/
│       │   └── logo/            # fitquest-logo.svg + variantes
│       ├── components/
│       │   ├── ui/              # shadcn/ui + atomiques
│       │   ├── exercise/        # Carte, liste, détail, filtres
│       │   ├── workout/         # Builder, mode guidé, mode libre, timer
│       │   ├── gamification/    # XP bar, badges, avatar, boutique
│       │   ├── stats/           # Graphiques, historique, dashboard
│       │   ├── body/            # Métriques corporelles + photos
│       │   └── settings/        # Thème, IA, notifications, profil
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Workout.tsx
│       │   ├── Library.tsx
│       │   ├── Profile.tsx
│       │   └── Settings.tsx
│       ├── stores/              # Zustand : user, workout, gamification, settings
│       ├── lib/                 # XP calc, timer, export, IA client, PDF
│       ├── i18n/                # FR / EN
│       └── types/               # TypeScript interfaces
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts              # Import exercises_seed.json
    └── src/
        ├── routes/              # /api/v1/...
        ├── services/
        ├── ai/                  # Adaptateurs : ClaudeProvider, OllamaProvider, LMStudioProvider, NoAIProvider
        ├── notifications/       # FreeSMS, HomeAssistant, webhook
        ├── export/              # Puppeteer PDF
        │   └── templates/       # HTML template fiche personnage
        └── uploads/             # Photos + images exercices
```

---

## 5. Modèle de Données (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  email         String?  @unique
  emailDigest   DigestFrequency?  // DAILY | WEEKLY | MONTHLY | NONE
  avatarStage   Int      @default(0)
  themeId       String   @default("void_rpg")
  level         Int      @default(1)
  totalXP       Int      @default(0)
  currentXP     Int      @default(0)
  xpBalance     Int      @default(0)  // XP dépensable boutique
  streak        Int      @default(0)
  lastWorkout   DateTime?
  createdAt     DateTime @default(now())
  workoutLogs   WorkoutLog[]
  bodyMetrics   BodyMetric[]
  bodyPhotos    BodyPhoto[]
  userBadges    UserBadge[]
}

model Exercise {
  id              String   @id
  nameFr          String
  nameEn          String
  category        String   // push | pull | legs | core | cardio | back
  musclesPrimary  String[]
  musclesSecondary String[]
  equipment       String   // none | dumbbells | barbell | pull_bar | other
  level           String   // beginner | intermediate | advanced
  type            String   // reps | duration
  instructionsFr  String
  instructionsEn  String
  tipsFr          String?
  tipsEn          String?
  imageUrl        String?
  imageAiGen      Boolean  @default(false)
  variations      String[] // IDs des variantes
}

model Program {
  id           String    @id @default(cuid())
  nameFr       String
  nameEn       String
  descFr       String?
  descEn       String?
  level        String
  daysPerWeek  Int
  durationWeeks Int?
  equipment    String[]
  isCustom     Boolean   @default(false)
  isAiGen      Boolean   @default(false)
  createdBy    String?   // userId si custom
  sessions     Session[]
}

model Session {
  id         String            @id @default(cuid())
  programId  String
  program    Program           @relation(fields: [programId], references: [id])
  nameFr     String
  nameEn     String
  order      Int
  exercises  SessionExercise[]
}

model SessionExercise {
  id              String  @id @default(cuid())
  sessionId       String
  session         Session @relation(fields: [sessionId], references: [id])
  exerciseId      String
  order           Int
  sets            Int
  reps            Int?
  durationSeconds Int?
  restSeconds     Int     @default(60)
}

model WorkoutLog {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  sessionId     String?
  sessionName   String         // snapshot nom séance
  date          DateTime       @default(now())
  durationSecs  Int
  xpEarned      Int
  completedSets CompletedSet[]
}

model CompletedSet {
  id           String     @id @default(cuid())
  logId        String
  log          WorkoutLog @relation(fields: [logId], references: [id])
  exerciseId   String
  exerciseName String     // snapshot
  setNumber    Int
  reps         Int?
  durationSecs Int?
  weightKg     Float?
}

model BodyMetric {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  date           DateTime @default(now())
  weightKg       Float?
  waistCm        Float?
  chestCm        Float?
  bicepCm        Float?
  thighCm        Float?
  customMetrics  Json?    // [{ name, value, unit }]
}

model BodyPhoto {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  date     DateTime @default(now())
  type     String   // full | front | back | side | arm | leg | other
  filePath String
  note     String?
}

model UserBadge {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  badgeId    String
  unlockedAt DateTime @default(now())
}

enum DigestFrequency {
  DAILY
  WEEKLY
  MONTHLY
  NONE
}
```

---

## 6. Authentification

### Approche : JWT + bcrypt, sans dépendance externe
- **Inscription** : écran RPG "Créer ton personnage" (username, mot de passe, email optionnel, choix avatar initial)
- **Connexion** : username + password
- **Token** : JWT stocké en httpOnly cookie (sécurisé, invisible au JS)
- **Refresh** : token refresh automatique (7 jours)
- **Multi-user** : chaque utilisateur a son propre profil/données
- **Admin** : premier compte créé = admin (peut gérer les exercices)

### Écran "Créer ton personnage" (style RPG)
1. Choisir son nom de héros (username)
2. Sélectionner son avatar de départ (parmi 3-4 silhouettes)
3. Définir son niveau de départ : Novice / Guerrier en devenir / Combattant
4. Email (optionnel) + fréquence de synthèse
5. Mot de passe
→ Animation de création de personnage avant redirection dashboard

---

## 7. Fonctionnalités

### MVP — Phase 1
| Feature | Description |
|---|---|
| Bibliothèque d'exercices | 30 exercices seed (poids du corps + haltères), images statiques, filtres catégorie/muscle/équipement/niveau |
| Gestion exercices | Créer, éditer, masquer, supprimer ses exercices custom |
| Programmes pré-établis | 3 programmes seed (débutant 3j, entretien 3j, intermédiaire 4j) |
| Création programme/séance | Builder libre, gestion sets/reps ou durée + temps de repos |
| Mode séance guidée | Timer travail/repos, exercice suivant, barre de progression |
| Mode séance libre | Consultation programme + check manuel |
| Système XP & niveaux | XP par séance avec bonus streak, courbe RPG |
| XP dépensable | Boutique : thèmes, cadres avatar, badges cosmétiques, titres |
| Badges & achievements | Jalons auto + badges achetables |
| Avatar évolutif | 6 stages SVG, effets débloquables |
| Tableau de bord | Streak, XP du jour, prochaine séance suggérée, activité récente |
| Historique | Séances passées avec détail sets/reps |
| Métriques corporelles | Poids, mensurations, champs custom + graphiques |
| Photos de progression | Import par zone, galerie comparaison avant/après |
| Thèmes | 3 palettes (Void RPG par défaut) |
| Auth multi-user | JWT + bcrypt, écran création personnage RPG |
| Responsive | Mobile (nav bas), tablette (sidebar icônes), desktop (sidebar complète) |

### Phase 2
| Feature | Description |
|---|---|
| Génération IA programme | Questionnaire → programme via IA multi-provider |
| Visuels exercices IA | Génération illustrations via IA ou import manuel |
| Graphiques avancés | Courbes volume, fréquence, métriques sur la durée |
| Notifications | Web push + FreeSMS + Home Assistant + webhook |
| Fiche personnage PDF | Export RPG : stats, avatar, badges, progression, graphiques |
| Export données | CSV et JSON complets |
| Multilingue | react-i18next FR + EN complet |
| Email digest | Synthèse périodique (daily/weekly/monthly) |

### Phase 3
- Import/export programmes JSON (partage communauté)
- Sync multi-appareils (compte cloud optionnel)

---

## 8. Architecture IA (Multi-Provider)

```typescript
interface AIProvider {
  generateProgram(profile, goals): Promise<Program>
  generateExerciseImage(name, style): Promise<Buffer>
  isAvailable(): Promise<boolean>
}
// Implémentations : ClaudeProvider | OllamaProvider | LMStudioProvider | NoAIProvider
```

| Mode | Modèle recommandé | Config |
|---|---|---|
| Aucune IA | — | Défaut |
| Claude API | claude-sonnet-4-20250514 | `CLAUDE_API_KEY` |
| Ollama embarqué | Phi-3 mini (texte) | Docker sidecar optionnel |
| Ollama externe | Mistral 7B+ | `OLLAMA_URL` |
| LM Studio externe | Au choix | `LMSTUDIO_URL` |

---

## 9. Système de Gamification

### XP  ⚠️ révisé au Sprint 7 — voir `Sprint7_Plan.md`
- XP étagée par **type d'exercice** : coefficients distincts reps vs durée (`XP_PER_REP` / `XP_PER_SEC`) pour que le gainage ne domine pas (l'ancien « 1 rép = 1 s = 1 XP » est abandonné).
- Bonus streak : +10%/jour consécutif (max +50%).
- Courbe de niveaux : retravaillée au Sprint 7 (l'ancienne `level * 150` linéaire est remplacée — formule + table dans `Sprint7_Plan.md`).
- Couleurs par palier de niveau (Bronze/Argent/Or/… ) sur jauge XP + badge.

### Boutique d'XP — ABANDONNÉE
Décision de cadrage (utilisateur) : pas de dépense d'XP. `xpBalance` reste au schéma mais inexploité. (Éventuellement reconsidéré bien plus tard.)

### Badges
| Badge | Condition |
|---|---|
| Premier pas | 1ère séance |
| Régularité | 7 jours consécutifs |
| Semaine parfaite | 5 séances en 7 jours |
| Centurion | 100 séances |
| Sans excuses | 30 séances poids du corps |
| Architecte | 1er programme custom créé |
| Sculpteur | 10 métriques enregistrées |
| Photographe | 5 photos importées |
| Montée en puissance | Niveau 10 |
| Légende | Niveau 50 |

---

## 10. Design & UX

### Navigation (responsive)
- **Mobile** : barre bas (Dashboard / Séance / Biblio / Profil)
- **Tablette** : sidebar icônes repliable
- **Desktop** : sidebar complète avec labels

### Écrans clés
1. **Création personnage** — écran RPG animé au 1er lancement
2. **Dashboard** — streak animé, XP bar, card prochaine séance, feed activité
3. **Lancement séance** — 3 choix : Programme / Libre / IA
4. **Mode guidé** — grand timer central, exercice actuel, suivant, progress bar
5. **Fin de séance** — XP animé, badges débloqués, évolution avatar
6. **Bibliothèque** — filtres, carte exercice + image, recherche
7. **Corps** — onglets Métriques (graphiques) / Photos (comparaison)
8. **Profil** — avatar + niveau + boutique XP + badges
9. **Paramètres** — thème, langue, IA, notifications, compte

### Esthétique RPG
- Polices : Orbitron (display, stats) + Inter (body)
- Effets : particules XP au gain, glow sur avatar, transitions slide
- Cards avec border glow selon rareté/niveau
- Sons optionnels (level up, badge, fin de séance)

---

## 11. Notifications

| Canal | Config | Usage |
|---|---|---|
| Web Push | Natif | Rappels séance, badges |
| FreeSMS | Token API | SMS hors connexion |
| Home Assistant | Webhook URL + token | Domotique |
| Webhook générique | URL | Tout autre système |

---

## 12. Fiche Personnage PDF

Export A4 via Puppeteer, template HTML dans `backend/src/export/templates/character-sheet.html` :
- Header : avatar stade actuel, nom héros, niveau, titre
- Stats : XP total, streak record, séances totales, temps d'entraînement
- Métriques corporelles : courbe poids + dernières mesures
- Top 3 exercices par volume
- Grille badges obtenus
- Graphique fréquence hebdomadaire (3 mois)
- Footer FitQuest + date

---

## 13. Plan de Développement

### Phase 1 — MVP (10 sprints)
| Sprint | Contenu |
|---|---|
| S1 | Setup mono-repo, Docker Compose, Prisma schema, seed exercices/programmes |
| S2 | Auth (JWT/bcrypt), écran création personnage RPG |
| S3 | Design system (couleurs, typo, composants atomiques, logo SVG intégré) |
| S4 | Bibliothèque exercices (liste, filtres, détail, CRUD) |
| S5 | Programmes + builder séance (sets/reps/durée/repos) |
| S6 | Mode guidé (timer Page Visibility API) + mode libre |
| S7 | Gamification : XP étagé reps/durée + courbe niveaux + couleurs par palier, badges, avatar évolutif (boutique XP abandonnée) — **découpé en 5 étapes : voir `Sprint7_Plan.md`** |
| S8 | Dashboard, historique, métriques corporelles, photos — **découpé en 5 étapes : voir `Sprint8_Plan.md`** |
| S9 | Thèmes, responsive mobile/tablette/desktop |
| S10 | Scripts install/update, tests, README, GitHub release |

### Phase 2 (6 sprints)
- S11-12 : IA multi-provider, génération programme + images
- S13 : Notifications (FreeSMS, HA, webhook)
- S14 : PDF fiche personnage
- S15 : i18n FR/EN complet, export CSV/JSON, email digest
- S16 : Polish, perf, accessibilité

---

## 14. Instructions pour Claude Code

### Initialisation
```bash
mkdir fitquest && cd fitquest && git init

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss postcss autoprefixer zustand react-router-dom react-i18next i18next lucide-react recharts
npx shadcn@latest init
cd ..

# Backend
mkdir backend && cd backend && npm init -y
npm install express prisma @prisma/client cors dotenv multer bcryptjs jsonwebtoken cookie-parser puppeteer
npm install -D typescript ts-node nodemon @types/express @types/node @types/bcryptjs @types/jsonwebtoken
npx prisma init
```

### Variables d'environnement (`.env.example`)
```env
PORT=3000
DATABASE_URL=postgresql://fitquest:password@db:5432/fitquest
JWT_SECRET=change_this_secret_key
JWT_EXPIRES_IN=7d

# IA (optionnel)
AI_PROVIDER=none           # none | claude | ollama | lmstudio
CLAUDE_API_KEY=
OLLAMA_URL=http://192.168.x.x:11434
LMSTUDIO_URL=http://192.168.x.x:1234

# Notifications (optionnel)
FREESMS_TOKEN=
HOME_ASSISTANT_URL=
HOME_ASSISTANT_TOKEN=
WEBHOOK_URL=
```

### Conventions
- TypeScript strict mode
- Composants fonctionnels + hooks uniquement
- Un store Zustand par domaine (userStore, workoutStore, gamificationStore, settingsStore)
- API REST versionnée : `/api/v1/...`
- Photos : volume Docker `/app/uploads` — jamais en base64 en BDD
- Timer séance : gérer Page Visibility API pour fond d'écran/veille
- Seed BDD : `prisma/seed.ts` importe `exercises_seed.json`
- Vérifier `AI_PROVIDER` avant tout appel IA

### Assets à créer
- `frontend/src/assets/logo/fitquest-icon.svg` — icône bouclier/épée seule
- `frontend/src/assets/logo/fitquest-logo-dark.svg` — logo horizontal dark
- `frontend/src/assets/logo/fitquest-logo-light.svg` — logo horizontal clair
- `frontend/src/assets/avatars/stage-0.svg` à `stage-5.svg` — évolution avatar
- `frontend/src/assets/exercises/` — images statiques exercices (PNG/WebP 400×300)
