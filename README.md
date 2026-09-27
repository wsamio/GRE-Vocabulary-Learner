# Vocabulary Learner

A simple and interactive vocabulary-learning web application designed to help users learn, review, and remember new words using flashcards, notes, and organized vocabulary files.

## Features

- 📚 **Vocabulary Flashcards** — Study words using interactive flashcards.
- 🔄 **Interactive Card Flipping** — Flip a flashcard to view information on the back.
- 📝 **Personal Notes** — Write notes behind each flashcard for meanings, examples, memory tricks, or other useful information.
- ⌨️ **Keyboard Support** — Use the keyboard to interact with flashcards while studying.
- 📂 **Vocabulary Files** — Load vocabulary from files and display the words inside the application.
- 📖 **Word-by-Word Learning** — Study vocabulary one word at a time in a focused learning interface.
- 💾 **Persistent Notes** — Keep personal notes associated with vocabulary items.

## Project Structure

```text
Vocabulary-Learner/
│
├── index.html
├── style.css
├── script.js
│
├── data/
│   └── vocabulary files
│
└── README.md
```

> The exact file structure may vary depending on the current version of the project.

## Screenshots

### Vocabulary Selection

<p align="center">
  <img src="https://github.com/user-attachments/assets/950b5053-685d-4c51-8f9a-4799cb647ea8" alt="Vocabulary Learner - Vocabulary Selection" width="700">
</p>

### Flashcard View

<p align="center">
  <img src="https://github.com/user-attachments/assets/a69a4209-ed73-48ab-9a91-c8ce8de4f648" alt="Vocabulary Learner - Flashcard View" width="700">
</p>

### Flashcard Back and Notes

<p align="center">
  <img src="https://github.com/user-attachments/assets/089a77bc-51df-4998-aa99-9502c656e2ff" alt="Vocabulary Learner - Flashcard Notes" width="700">
</p>

### Vocabulary Learning Interface

<p align="center">
  <img src="https://github.com/user-attachments/assets/77cd2cb9-7986-4cfc-b2d3-b3f31de96743" alt="Vocabulary Learner - Learning Interface" width="700">
</p>

## How It Works

The application loads vocabulary from the available vocabulary files and presents the words through an interactive flashcard interface.

Each flashcard contains information about a vocabulary word. The card can be flipped to reveal the back side, where additional information and personal notes can be viewed or edited.

### Studying a Word

1. Open the application.
2. Select or load the vocabulary you want to study.
3. A word will appear on the flashcard.
4. Flip the card to view the information on the back.
5. Add or edit your personal notes if needed.
6. Move to the next word and continue studying.

## Notes

The back of each flashcard includes a writing area for personal notes.

While editing notes, keyboard input should remain focused on the note field. For example, pressing **Space** while writing a note should insert a space rather than accidentally flipping the flashcard.

## Running the Project

Because this is a web-based project, you can run it using a local development server.

For example, if you have VS Code with the **Live Server** extension:

1. Open the project folder in VS Code.
2. Open `index.html`.
3. Right-click the file.
4. Select **Open with Live Server**.
5. The application will open in your browser.

You can also use any other local HTTP server suitable for static web projects.

## Technologies

The project is built using standard web technologies:

- **HTML** — application structure
- **CSS** — styling and layout
- **JavaScript** — flashcard functionality, vocabulary handling, notes, and user interaction

No external framework is required for the core application.

## Keyboard Interaction

The application supports keyboard interaction where applicable.

Special care is taken to prevent flashcard shortcuts from interfering with text input fields. When the user is typing inside the notes area, normal typing behavior should take priority.

## Purpose

The goal of Vocabulary Learner is to provide a simple study environment where vocabulary can be reviewed efficiently without unnecessary complexity.

The project focuses on:

- Active vocabulary recall
- Repeated review
- Flashcard-based learning
- Personal note-taking
- Simple and distraction-free interaction

## Future Improvements

Possible future improvements include:

- Progress tracking
- Spaced repetition
- Vocabulary search
- Word categories
- Difficulty levels
- Study statistics
- Import/export functionality
- Additional keyboard shortcuts
- Multiple vocabulary sets