## Dashboard

The dashboard is your home page: it gathers the essentials of your progress at a glance. As soon as you log in, you'll see your current level, your tier (colour rank) and your experience bar filling up as you train.

![FitQuest dashboard](docs/screenshots/dashboard.png)

### The main widgets

- **Streak**: the number of consecutive days you've trained. The streak resets if you skip a planned day, making it your best incentive to stay consistent.
- **Experience (XP)**: your total accumulated points. The bar shows how far you are from the next level.
- **Last workout**: a quick reminder of your most recent session, with its date and program.

### The configurable sidebar

The side panel hosts widgets that you choose yourself from Settings: fitness index, a shortcut to a workout, latest trophies, and more. You can enable, disable and reorder these widgets so the dashboard matches the way you train. On mobile, the sidebar collapses to give the central content all the room it needs.

### XP bar, level and tier

The XP bar at the top of the page is deliberately prominent: it's the heart of the game loop. Every streak you keep, every workout you complete and every goal you reach adds points to it. When the bar is full, you level up and, at certain milestones, you change tier — Bronze, Silver, Gold, Emerald, then Diamond. The dashboard highlights these moments to make progress feel tangible, even when physical results take time to show.

Think of the dashboard as your condensed "character sheet": a single place to check your consistency, your momentum and what's left before the next milestone.

## Programs

Programs are the training plans you follow. A program groups a list of exercises, organised into sets and reps, that you can launch as a workout whenever you like.

![Program list](docs/screenshots/programs.png)

### Browse and filter

The program library shows all your routines. You can filter them by **goal** (strength, hypertrophy, endurance…) and by targeted **muscle group**. These filters help you quickly find the right plan depending on your mood or your weekly planning.

### Create a program

The program builder lets you compose a routine from scratch:

1. Give your program a name and a goal.
2. Add exercises from the list.
3. Set the number of sets, reps and rest time for each one.
4. Reorder the exercises by drag-and-drop to match the execution order you want.

### Import and export

You don't have to build everything by hand. From the **import** page you can load programs in JSON format — handy for picking up shared routines or ones extracted from a book. Conversely, **export** lets you save your programs as JSON, to archive them or reuse them elsewhere. Every import is tracked, so you can cleanly purge a batch of programs if you change your mind.

## Workouts

A workout is a program you run in real time. FitQuest guides you exercise by exercise, set by set, all the way to the final summary.

![Workout in progress](docs/screenshots/workouts.png)

### Start a workout

Pick a program and tap "Start". The workout opens on the first exercise, showing the sets to perform and the suggested weight.

### The set-by-set flow

Workout mode paces your effort:

- **Set**: you enter the weight and reps you actually performed, then confirm.
- **Rest**: a recovery timer starts automatically between sets, with a sound cue when it ends.
- **Transition**: once all the sets of an exercise are done, FitQuest moves on to the next exercise.

The interface stays deliberately clean during effort: large input zones, few distractions, and a footer that's always within reach.

### Post-workout feeling

At the end, FitQuest asks for your **feeling** on a scale of 1 to 5, shown as pixel-art faces. This quick rating feeds your history and helps you spot sessions that were too hard or too easy over time.

### History

All your completed workouts are saved in the **history**: date, program, feeling and volume worked. It's your training memory, useful for seeing your progress and adjusting your loads.

## Body

The Body section centralises all the tracking of your physique, beyond your workouts.

![Body tracking](docs/screenshots/body.png)

### Weight, measurements and photos

You can regularly record:

- your **weight**;
- your **measurements** (arm, waist, thighs…);
- progress **photos**, stored securely (never in a database, always on a dedicated volume).

Every entry is dated and kept to build a reliable history.

### Trend charts

The data you enter feeds clear **charts**: you can visualise the evolution of your weight and measurements over time. This is often more meaningful than a single day's figure, because it smooths out daily fluctuations.

### The fitness index

The **fitness index** combines two complementary readings:

- the **FFMI** (Fat-Free Mass Index), which estimates your lean mass relative to your height;
- a **score from 0 to 100**, more intuitive, with a textual interpretation.

This index gives you an overall benchmark of your physical condition, without coming down to the scale alone. A colour-coded scale and a trend curve help you place your progress and understand what the figure really means.

## Profile

Your profile is your player identity in FitQuest.

![Character profile](docs/screenshots/profile.png)

### Class and avatar

When you sign up, you choose a **class** among four, each with its own pixel-art avatar. This choice is purely cosmetic and identity-based: it personalises your sheet without changing the game rules.

### Level, XP and goal

Your profile shows your **level**, your total **XP** and your current **tier**. You also set your **main goal** here (bulking, fat loss, strength, general fitness…), which guides certain suggestions and the way your statistics are read.

### Trophies

The **trophies** (badges) you've unlocked appear on your profile. They reward a variety of achievements: consistency, volume, exploring features. It's a showcase of your journey.

### PDF sheet

You can export a **character sheet as a PDF**: a polished summary of your class, level, statistics and trophies. Handy for keeping a record or sharing your progress outside the app.

## Settings

Settings let you tailor FitQuest to your preferences.

![Settings page](docs/screenshots/settings.png)

### Language and theme

- **Language**: switch between French and English at any time; the whole interface, including this help, follows your choice.
- **Theme**: three visual themes are available to adjust the mood and reading comfort.

### Sidebar widgets

From Settings you enable, disable and reorder the **widgets** shown on the dashboard. This is where you decide which information you want to see first.

### Email digest

The **email digest** periodically sends you a summary of your activity (workouts, progress, current streak). You can enable and configure it at the pace you want.

### Data export

You can download all your data in a **ZIP archive**: a complete export to back up or migrate your history. It's your guarantee that you always remain the owner of your data.

### Help

The Help section opens this built-in documentation, which can be read offline once the app has loaded.

## Gamification

Gamification is what turns training into an adventure. Here's how the system works.

![Progression system](docs/screenshots/gamification.png)

### The XP system

You earn **experience (XP)** by completing workouts, keeping your streak and reaching goals. Moving from one level to the next follows a progressive curve: it takes **10·n² + 90·n** accumulated points to reach level *n*. In practice, the first levels come quickly to get you hooked, then each milestone asks for a little more effort, rewarding long-term commitment.

### The 5 tiers

As you level up, you cross five **tiers** of increasing prestige:

1. **Bronze** — the start of the adventure.
2. **Silver** — consistency sets in.
3. **Gold** — a seasoned practitioner.
4. **Emerald** — remarkable commitment.
5. **Diamond** — the elite, the peak of progression.

Each tier changes the colour of your visual identity and marks a symbolic step.

### Badges

**Badges** reward specific achievements, for example: completing your first workout, keeping a long streak, filling in a complete body check-up, exploring statistics, or reaching a training volume. They're added automatically to your profile as soon as the condition is met.

### The streak

The **streak** counts your consecutive training days. It's the most powerful consistency driver: watching the number climb makes you want to keep the chain unbroken. Missing a planned day resets it, so a short session beats no session at all.
