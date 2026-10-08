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
  - Add individual words or **Bulk Paste** words (comma, space, or newline separated).
  - In-place spelling edits and word deletion.
  - **Export / Import JSON**: Back up or share your custom lists and progress.
  - Pre-loaded with curated Dolch sight words, colors, and animals out of the box.

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
