# WordQuest - Word-Learning Flashcard Game for Kids 🌟

A fun, interactive word-learning flashcard web application built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

Designed for parents to review sight words and vocabulary with their children at their own pace.

---

## ✨ Features

- **Word Sets & Lists Hierarchy**:
  - Words are grouped into **Sets** (e.g. *Dolch Sight Words*, *Everyday Explorer*), which are broken down into **Lists** (e.g. *Pre-K Primer*, *Kindergarten*, *First Grade*).
  - Sets and lists can hold an arbitrary number of words.
- **Flexible Play Modes**:
  - Play against an entire **Set** (all unique words in the set shuffled together).
  - Play against a specific **List** (focused list session).
  - Shuffled presentation without replacement until each word is completed.
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
  - Pre-loaded with curated Dolch sight words, colors, and animals out of the box.

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
      "id": "set-dolch-sight-words",
      "name": "Dolch Sight Words",
      "description": "Essential high-frequency sight words for early readers",
      "icon": "📚",
      "lists": [
        {
          "id": "list-pre-k",
          "name": "Pre-K Primer (List 1)",
          "description": "First early sight words for preschool and pre-k",
          "words": [
            { "id": "w-1", "word": "a" },
            { "id": "w-2", "word": "and" },
            { "id": "w-3", "word": "away" }
          ]
        }
      ]
    }
  ],
  "stats": {
    "away": {
      "timesCorrect": 5,
      "timesIncorrect": 1,
      "currentStreak": 3,
      "lastPracticed": "2026-10-07T21:15:00.000Z"
    }
  },
  "history": [
    {
      "id": "game-1728340000000",
      "completedAt": "2026-10-07T21:15:00.000Z",
      "targetType": "list",
      "targetName": "Pre-K Primer (List 1)",
      "totalWords": 10,
      "correctCount": 9,
      "incorrectCount": 1,
      "finalScore": 8,
      "accuracy": 90,
      "missedWords": ["away"]
    }
  ]
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
    "description": "Core weekly vocabulary lists",
    "icon": "🚀",
    "lists": [
      {
        "name": "Week 1",
        "description": "Short vowel sounds",
        "words": ["cat", "dog", "sun", "big", "red"]
      },
      {
        "name": "Week 2",
        "description": "Action verbs",
        "words": ["jump", "run", "play", "help", "look"]
      }
    ]
  },
  {
    "name": "Space & Nature",
    "icon": "🪐",
    "lists": [
      {
        "name": "Solar System",
        "words": ["sun", "moon", "star", "earth", "mars"]
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

## 🛠 Tech Stack

- **React 19**
- **TypeScript 5.8**
- **Vite 6**
- **Tailwind CSS v4**
- **Lucide React** (icons)
- **Canvas-Confetti** (celebrations)
- **Web Audio API** (custom synthesizer for chimes & fanfares)
- **Web Speech API** (speech synthesis for pronunciation)
