# Changelog

Toutes les évolutions notables de FitQuest. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/).

## [2.0.1] — 2026-06-23

Correctifs ciblant l'expérience d'administration et la robustesse des mises à jour
(notamment les sauts de version v1 → v2).

### Corrigé / Amélioré

- **Administration sans friction** — le rôle est désormais lu en base de données
  (et non plus depuis le JWT) : une promotion ou rétrogradation prend effet
  immédiatement, sans re-login. Un token dont le compte a été supprimé est rejeté.
- **Bootstrap admin automatique** — si aucun administrateur n'existe, le seed promeut
  le plus ancien compte. Couvre les nouvelles installations comme les montées de version
  depuis une version sans rôle ADMIN (plus besoin de SQL manuel).
- **Mise à jour auto-actualisée** — `update.sh` se ré-exécute après le `git pull` afin que
  la version fraîchement tirée s'exécute dès le premier passage (corrige les pièges de saut
  de version, ex. variable `SMTP_ENC_KEY` manquante).

## [2.0.0] — 2026-06-23 — Phase 2

Deuxième cycle majeur : internationalisation, suivi corporel avancé, administration,
documentation intégrée, et cloisonnement des programmes par utilisateur.

### Ajouté

- **i18n FR / EN complet** — toute l'interface traduite, bascule de langue à chaud.
- **Indice de Forme** — FFMI + score 0-100 avec interprétation, graphe d'évolution, badges associés.
- **Objectif principal & packs** — objectif utilisateur, programmes recommandés, catalogue de packs JSON importables.
- **Ressenti post-séance** — échelle 1-5 (visages pixel art), affiché dans l'historique.
- **Onboarding guidé** — modale au 1er login (taille, objectif, avatar), non bloquante.
- **Export fiche personnage PDF** — avatar, niveau, badges, métriques (Puppeteer / Chromium).
- **Email digest** — synthèse périodique opt-in (quotidienne / hebdomadaire / mensuelle), SMTP par utilisateur.
- **Widgets sidebar configurables** — streak, XP, dernière séance, poids, progression badges.
- **Changement de personnage** — sélecteur de classe accessible après l'inscription.
- **Panel administration** — rôle ADMIN, gestion des utilisateurs, purge sélective, statistiques globales.
- **Gestion de compte (RGPD)** — export ZIP complet, suppression de compte.
- **Import / export de programmes JSON** — traçabilité des imports (ImportLog), purge par lot.
- **Documentation utilisateur intégrée** — page `/help` FR / EN avec captures d'écran, génération automatisée via Puppeteer.

### Modifié

- **Programmes cloisonnés par utilisateur** — les programmes du catalogue (seed) restent partagés
  en lecture (modifiables par un admin uniquement) ; les programmes personnels deviennent privés
  à leur créateur. Badge « Catalogue partagé » et avertissement de suppression pour l'admin.
- **Onboarding** — drapeau de complétion désormais par utilisateur (et non global au navigateur).

### Reporté en Phase 3

- IA multi-provider (génération de programmes / illustrations).
- Notifications multi-canal (web push, SMS, Home Assistant, webhook).
- Synchronisation multi-appareils.

## [1.0.1]

Corrections de la première version stable.

## [1.0.0] — 2026-06-17 — Phase 1

Première version stable : authentification & personnage RPG, séance Boss Fight pixel art,
XP / niveaux / paliers, badges, avatar évolutif, métriques corporelles + photos, programmes
& builder, dashboard, historique, 3 thèmes, PWA installable.
