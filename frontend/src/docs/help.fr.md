## Tableau de bord

Le tableau de bord est ta page d'accueil : il rassemble en un coup d'œil l'essentiel de ta progression. Dès la connexion, tu y retrouves ton niveau actuel, ton tier (rang de couleur) et ta barre d'expérience qui se remplit au fil de tes séances.

![Tableau de bord de FitQuest](docs/screenshots/dashboard.png)

### Les widgets principaux

- **Série (streak)** : le nombre de jours consécutifs où tu t'es entraîné. La série se réinitialise si tu sautes une journée prévue, c'est ta meilleure motivation pour rester régulier.
- **Expérience (XP)** : ton total de points cumulés. La barre montre la distance qui te sépare du prochain niveau.
- **Dernière séance** : un rappel rapide de ton dernier entraînement, avec sa date et son programme.

### La sidebar configurable

La barre latérale accueille des widgets que tu choisis toi-même depuis les Réglages : indice de forme, raccourci vers une séance, derniers trophées, etc. Tu peux activer, désactiver et réordonner ces widgets pour que le tableau de bord corresponde à ta façon de t'entraîner. Sur mobile, la sidebar se replie pour laisser toute la place au contenu central.

### Barre XP, niveau et tier

La barre d'XP en haut de page est volontairement très visible : c'est le cœur de la boucle de jeu. Chaque série terminée, chaque séance complétée et chaque objectif atteint y ajoutent des points. Quand la barre est pleine, tu montes de niveau et, à certains paliers, tu changes de tier — Bronze, Argent, Or, Émeraude puis Diamant. Le tableau de bord met en avant ces moments pour rendre la progression tangible, même quand les résultats physiques mettent du temps à arriver.

Pense au tableau de bord comme à ta « fiche de personnage » résumée : un endroit unique pour vérifier ta régularité, ton élan et ce qu'il te reste à accomplir avant le prochain palier.

## Programmes

Les programmes sont les plans d'entraînement que tu suis. Un programme regroupe une liste d'exercices, organisés en séries et répétitions, que tu peux lancer en séance quand tu veux.

![Liste des programmes](docs/screenshots/programs.png)

### Parcourir et filtrer

La bibliothèque de programmes affiche toutes tes routines. Tu peux les filtrer par **objectif** (force, hypertrophie, endurance…) et par **groupe musculaire** ciblé. Ces filtres t'aident à retrouver rapidement le bon plan selon ton humeur ou ta planification de la semaine.

### Créer un programme

Le constructeur de programme (ProgramBuilder) te laisse composer ta routine de zéro :

1. Donne un nom et un objectif à ton programme.
2. Ajoute des exercices depuis la liste.
3. Définis pour chacun le nombre de séries, de répétitions et le temps de repos.
4. Réordonne les exercices par glisser-déposer pour respecter l'ordre d'exécution souhaité.

### Importer et exporter

Tu n'es pas obligé de tout créer à la main. Depuis la page d'**import**, tu peux charger des programmes au format JSON — pratique pour récupérer des routines partagées ou extraites d'un livre. À l'inverse, l'**export** te permet de sauvegarder tes programmes en JSON, pour les archiver ou les réutiliser ailleurs. Chaque import est tracé, ce qui te permet de purger proprement un lot de programmes si tu changes d'avis.

## Séances

Une séance, c'est un programme que tu exécutes en temps réel. FitQuest t'accompagne exercice par exercice, série par série, jusqu'au bilan final.

![Séance en cours](docs/screenshots/workouts.png)

### Lancer une séance

Choisis un programme et appuie sur « Démarrer ». La séance s'ouvre sur le premier exercice, avec les séries à réaliser et le poids suggéré.

### Le déroulé série par série (SetsFlow)

Le mode séance guide ton effort de façon rythmée :

- **Série** : tu saisis le poids et les répétitions réellement effectués, puis tu valides.
- **Repos** : un minuteur de récupération se lance automatiquement entre les séries, avec un signal sonore à la fin.
- **Transition** : une fois toutes les séries d'un exercice terminées, FitQuest enchaîne sur l'exercice suivant.

L'interface reste volontairement épurée pendant l'effort : grosses zones de saisie, peu de distractions, footer toujours accessible.

### Le ressenti post-séance

À la fin, FitQuest te demande ton **ressenti** sur une échelle de 1 à 5, représentée par des visages en pixel art. Cette note rapide alimente ton historique et t'aide à repérer les séances trop dures ou trop faciles au fil du temps.

### Historique

Toutes tes séances terminées sont enregistrées dans l'**historique** : date, programme, ressenti et volume travaillé. C'est ta mémoire d'entraînement, utile pour constater tes progrès et ajuster tes charges.

## Corps

La section Corps centralise tout le suivi de ton physique, au-delà des séances.

![Suivi du corps](docs/screenshots/body.png)

### Poids, mensurations et photos

Tu peux enregistrer régulièrement :

- ton **poids** ;
- tes **mensurations** (tour de bras, taille, cuisses…) ;
- des **photos** de progression, stockées en toute sécurité (jamais dans une base de données, toujours sur un volume dédié).

Chaque mesure est datée et conservée pour construire un historique fiable.

### Graphes d'évolution

Les données saisies alimentent des **graphes** clairs : tu visualises l'évolution de ton poids et de tes mensurations sur la durée. C'est souvent plus parlant qu'un simple chiffre du jour, car cela lisse les variations quotidiennes.

### L'indice de forme

L'**indice de forme** combine deux lectures complémentaires :

- le **FFMI** (Fat-Free Mass Index), qui estime ta masse maigre relative à ta taille ;
- un **score de 0 à 100**, plus intuitif, accompagné d'une interprétation textuelle.

Cet indice te donne un repère global sur ta condition physique, sans se réduire à la seule balance. Une échelle colorée et une courbe d'évolution t'aident à situer ta progression et à comprendre ce que le chiffre signifie réellement.

## Profil

Le profil, c'est ton identité de joueur dans FitQuest.

![Profil du personnage](docs/screenshots/profile.png)

### Classe et avatar

À l'inscription, tu choisis une **classe** parmi quatre, chacune avec son avatar en pixel art. Ce choix est purement cosmétique et identitaire : il personnalise ta fiche sans modifier les règles du jeu.

### Niveau, XP et objectif

Ton profil affiche ton **niveau**, ton **XP** total et ton **tier** courant. Tu y définis aussi ton **objectif principal** (prise de masse, perte de gras, force, forme générale…), qui oriente certaines suggestions et la lecture de tes statistiques.

### Trophées

Les **trophées** (badges) débloqués apparaissent sur ton profil. Ils récompensent des accomplissements variés : régularité, volume, exploration des fonctionnalités. C'est une vitrine de ton parcours.

### Fiche PDF

Tu peux exporter une **fiche personnage en PDF** : un récapitulatif soigné de ta classe, ton niveau, tes statistiques et tes trophées. Pratique pour garder une trace ou partager ta progression hors de l'application.

## Réglages

Les réglages te permettent d'adapter FitQuest à tes préférences.

![Page des réglages](docs/screenshots/settings.png)

### Langue et thème

- **Langue** : bascule entre français et anglais à tout moment ; toute l'interface, y compris cette aide, suit ton choix.
- **Thème** : trois thèmes visuels sont disponibles pour ajuster l'ambiance et le confort de lecture.

### Widgets de la sidebar

Depuis les réglages, tu actives, désactives et réordonnes les **widgets** affichés sur le tableau de bord. C'est ici que tu décides de l'information que tu veux voir en priorité.

### Digest email

Le **digest email** t'envoie périodiquement un résumé de ton activité (séances, progression, série en cours). Tu peux l'activer et le configurer selon le rythme souhaité.

### Export des données

Tu peux télécharger l'ensemble de tes données dans une **archive ZIP** : un export complet pour sauvegarder ou migrer ton historique. C'est ta garantie de toujours rester propriétaire de tes données.

### Aide

La section Aide ouvre cette documentation intégrée, consultable hors-ligne une fois l'application chargée.

## Gamification

La gamification est ce qui transforme l'entraînement en aventure. Voici comment fonctionne le système.

![Système de progression](docs/screenshots/gamification.png)

### Le système d'XP

Tu gagnes de l'**expérience (XP)** en complétant des séances, en tenant ta série et en atteignant des objectifs. Le passage d'un niveau au suivant suit une courbe progressive : il faut **10·n² + 90·n** points cumulés pour atteindre le niveau *n*. Concrètement, les premiers niveaux arrivent vite pour t'accrocher, puis chaque palier demande un peu plus d'effort, ce qui récompense l'engagement sur la durée.

### Les 5 tiers

Au fil des niveaux, tu franchis cinq **tiers** de prestige croissant :

1. **Bronze** — le début de l'aventure.
2. **Argent** — la régularité s'installe.
3. **Or** — un pratiquant confirmé.
4. **Émeraude** — un engagement remarquable.
5. **Diamant** — l'élite, le sommet de la progression.

Chaque tier change la couleur de ton identité visuelle et marque une étape symbolique.

### Les badges

Les **badges** récompensent des accomplissements précis, par exemple : compléter ta première séance, tenir une longue série, remplir un bilan corporel complet, explorer les statistiques, ou atteindre un volume d'entraînement. Ils s'ajoutent automatiquement à ton profil dès la condition remplie.

### La série (streak)

La **série** compte tes jours d'entraînement consécutifs. C'est le moteur de régularité le plus puissant : voir le chiffre grimper donne envie de ne pas casser la chaîne. Manquer une journée prévue la réinitialise, alors mieux vaut une petite séance que pas de séance du tout.
