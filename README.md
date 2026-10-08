# WordQuest - Word-Learning Flashcard Game for Kids 🌟

> 🎮 **Play Live**: **[https://brianspowers.github.io/flashcard-quiz/](https://brianspowers.github.io/flashcard-quiz/)**  
> *Open directly in your browser on iPad, tablet, phone, or desktop — no login or install needed.*

A fun, interactive word-learning flashcard web application built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

Designed for parents to review sight words and vocabulary with their children at their own pace.

---

## 🏫 Default Wordlist: Woodland Springs Elementary (WSES) Series

The application comes pre-loaded with **WSES 1st Grade - Book #1** from **Woodland Springs Elementary (WSES)**:

- **Current Edition**: High Frequency Word Book #1 (1st Grade)
- **Total Words**: 100 high-frequency words
- **Structure**: 10 lists of 10 words each (100 words total)

### 📚 Ready for Future WSES Books (Book #2, Book #3, etc.)
As your child progresses and additional word books are issued:
- **Automatic Codebase Defaults (Auto-Discovery)**:
  1. Add `src/data/presets/wses-1st-grade-book-2.json`.
  2. Register it in [`src/data/presetRegistry.ts`](file:///c:/Users/Brian%20Powers/dev/flashcard-quiz/src/data/presetRegistry.ts) with `isDefaultAutoLoaded: true`.
  3. **Auto-Sync**: Any browser (new or existing) will automatically receive Book #2 on next app launch without wiping Book #1 or resetting learning stats!
- **1-Click In-App Bookshelf**: Click **Manage Words** &rarr; **Preset Books** to view all official books and starter themes, and install or re-sync them with a single click.
- **Adding Future Books via JSON Import**: You can also populate the template [`wordlists/wses-1st-grade-book-2-template.json`](./wordlists/wses-1st-grade-book-2-template.json) and click **Import**.
- **Adding Future Books in the UI**: Click **Manage Words** &rarr; **New Set** (e.g. *"WSES 1st Grade - Book #2"*). Add lists and paste words using **Bulk Paste Words**.

---

## 📁 Pre-Packaged Word List Library (`wordlists/` & `src/data/presets/`)

The repository includes ready-to-use presets:

| Preset | Details | In-App 1-Click |
|---|---|---|
| **WSES 1st Grade - Book #1** | 10 lists &bull; 100 high-frequency sight words | Auto-Loaded Default |
| **WSES 1st Grade - Book #2 Template** | 10 lists &bull; Ready-to-fill template in `wordlists/` | Ready to configure |
| **Dolch Sight Words** | 5 lists &bull; Pre-K Primer, Kindergarten, 1st Grade | Available in Preset Books |
| **Everyday Explorer Themes** | 3 lists &bull; Creatures, Colors & Magic, Yummy Treats | Available in Preset Books |

### How to Load Any Preset:
- **Method 1 (Instant 1-Click)**: Click **Manage Words** &rarr; **Preset Books**, then click **Add to My Sets** or **Re-sync**.
- **Method 2 (File Import)**: Click **Manage Words** &rarr; **Import**, and select any `.json` file from the `wordlists/` directory.

---

## ✨ Features

- **Word Sets & Lists Hierarchy**:
  - Words are grouped into **Sets**, which are further broken down into **Lists**.
  - Sets and lists can hold an arbitrary number of words.
- **Flexible Play Modes**:
  - **Play Set**: Click **Play Set** on any book to select your preferred practice size:
    - **Smart Subset Sizes** (e.g. **10**, **20**, **30**, or **50** words): Uses our **Smart Even-Distribution Algorithm** to prioritize words practiced the fewest times overall, ensuring every word in the book is reviewed evenly across sessions!
    - **Entire Set**: Practice all words in the book in shuffled order.
  - **Play Specific List**: Focused practice on an individual list.
  - **Practice Missed Words**: Directly replay struggled words after completing any game.
- **Parent Co-Pilot Controls & Scoring**:
  - A giant, child-friendly flashcard displays one word at a time.
  - The child reads aloud, and the parent scores:
    - **Got It (+1)**: +1 point, cheerful chime, mini confetti burst, streak tracking.
    - **Try Again (-1)**: -1 point, gentle sound effect.
  - **Undo**: Quickly correct accidental clicks (`Z` key).
  - **Audio Pronunciation**: Text-to-speech speaker button on each card (`S` key) and auto-pronounce toggle.
  - **Keyboard Shortcuts** for rapid parent scoring:
    - `Right Arrow` / `Enter` / `Space` / `1`: Correct (+1)
    - `Left Arrow` / `Backspace` / `X` / `0`: Incorrect (-1)
    - `Z`: Undo last word
    - `S` or `P`: Pronounce word
- **End-of-Game Celebration & Focused Practice**:
  - Confetti explosion and victory fanfare on deck completion!
  - Star ratings, accuracy percentage, and score breakdown.
  - **Practice Missed Words**: Directly launch a mini-round with only the words the child struggled on.
- **In-Depth Statistics Tracking**:
  - **Set Level**: Total attempts, correct/incorrect totals, and accuracy % for each set.
  - **List Level**: Table of lists with word counts, attempts, and mastery rates.
  - **Individual Word Level**: Searchable and filterable table showing every word's attempts, accuracy %, current streak, and last practiced date. Sort by *Struggling Words First* to focus review.
  - **Game History**: Log of past game sessions.
- **Administrative Interface**:
  - Create, edit, and delete Sets and Lists.
  - Add individual words or **Bulk Paste** words (comma or newline separated).
  - In-place spelling edits and word deletion.
  - **Export / Import JSON**: Back up or share your custom lists and progress.

---

## 📥 Word List Import & Export Formats

The application provides two ways to add and import word lists: **JSON Import** (in the header of the *Manage Words* tab) and **Plain Text Bulk Paste** (within any list).

### 1. Full Backup Export/Import Format (JSON)

When clicking **Export JSON**, the app exports a full snapshot containing word collections, word performance statistics, and gameplay history:

```json
{
  "version": 1,
  "exportedAt": "2026-10-07T21:20:00.000Z",
  "sets": [
    {
      "id": "set-wses-1st-grade-book-1",
      "name": "High Frequency Word Book #1",
      "description": "Woodland Springs Elementary (WSES) 1st Grade Word Lists",
      "icon": "🏫",
      "lists": [
        {
          "id": "list-1",
          "name": "List 1",
          "words": [
            { "id": "w-1", "word": "the" },
            { "id": "w-2", "word": "of" },
            { "id": "w-3", "word": "and" }
          ]
        }
      ]
    }
  ],
  "stats": {
    "the": {
      "timesCorrect": 5,
      "timesIncorrect": 0,
      "currentStreak": 5,
      "lastPracticed": "2026-10-07T21:15:00.000Z"
    }
  },
  "history": [ ... ]
}
```

Any file exported in this format can be re-imported via **Import** with 100% fidelity.

---

### 2. Simplified Custom Set Array (JSON)

To create or share custom word sets without needing IDs, timestamps, or stats, you can import a simple JSON array of sets. Words can simply be strings rather than objects:

```json
[
  {
    "name": "First Grade Sight Words",
    "description": "Core vocabulary lists",
    "icon": "🚀",
    "lists": [
      {
        "name": "List 1",
        "description": "Short vowel sounds",
        "words": ["cat", "dog", "sun", "big", "red"]
      },
      {
        "name": "List 2",
        "description": "Action verbs",
        "words": ["jump", "run", "play", "help", "look"]
      }
    ]
  }
]
```

> **Note:** Any missing `id` properties will be automatically generated upon import.

---

### 3. Single Set Object (JSON)

You can also import a single set containing one or more lists:

```json
{
  "name": "Animal Friends",
  "icon": "🦁",
  "description": "Common farm and wild animals",
  "lists": [
    {
      "name": "Farm",
      "words": ["cow", "pig", "sheep", "horse", "goat"]
    },
    {
      "name": "Safari",
      "words": ["lion", "zebra", "giraffe", "monkey"]
    }
  ]
}
```

---

### 4. Plain Text "Bulk Paste Words" (No JSON Required)

If you have a list from a teacher, email, or curriculum worksheet and do not want to create a JSON file:

1. Open **Manage Words** &rarr; select any list.
2. Click **Bulk Paste Words**.
3. Paste words separated by commas or newlines:
   ```text
   apple, banana, orange
   grape, peach, pear
   watermelon
   ```
4. Click **Add Words Now**. Words are automatically trimmed, validated, and deduplicated against existing entries.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Lint Check
```bash
npm run lint
```

---

## 🌐 GitHub Pages Deployment

The application is deployed live to **[https://brianspowers.github.io/flashcard-quiz/](https://brianspowers.github.io/flashcard-quiz/)**.

### Automatic & On-Demand Deployments:
- **Continuous Deployment**: Every push to the `main` branch automatically triggers the build and deployment workflow. Your live app updates in ~35 seconds!
- **Manual Trigger**: You can also re-trigger deployments anytime on-demand:
  1. In your GitHub repository, click the **Actions** tab.
  2. In the left workflow sidebar, click **Deploy to GitHub Pages**.
  3. Click **Run workflow** &rarr; select branch `main` &rarr; click **Run workflow**.

> **One-Time GitHub Pages Setup**:
> 1. In your GitHub repository, navigate to **Settings** &rarr; **Pages**.
> 2. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.

---

## 🛠 Tech Stack

- **React 19**
- **TypeScript 5.8**
- **Vite 6**
- **Tailwind CSS v4**
- **Lucide React** (icons)
- **Canvas-Confetti** (celebrations)
- **Web Audio API** (custom synthesizer for chimes & fanfares)
- **Web Speech API** (speech synthesis for pronunciation)
