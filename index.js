import wordBank from "./word-bank.js";
import readline from "readline";

class HangmanGame {
  constructor() {
    // Create readline interface for user input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // Track game stats - start at 0
    this.wins = 0;
    this.losses = 0;
  }

  // ASCII Art Hangman Stages
  hangmanStages = [
    `
  +---+
  |   |
      |
      |
      |
      |
=========`,

    `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,

    `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,

    `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,

    `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,

    `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,

    `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
  ];

  // Randomly select a word from the imported word bank
  getRandomWord = () => {
    const index = Math.floor(Math.random() * wordBank.length);
    return wordBank[index];
  };

  // Create display of underscores representing letters
  // Converts the word to an array of underscores, then joins back to a string
  initializeDisplay = (word) => {
    return word
      .split("")
      .map(() => "_")
      .join(" ");
  };

  // Check if the guessed letter is in the word
  // Updates the display if the letter is found
  checkGuess = (letter, word, currentDisplay) => {
    // Convert current display and word to arrays for manipulation
    const displayArray = currentDisplay.split(" ");
    const wordArray = word.split("");
    let correctGuess = false;

    // Iterate through word to reveal matching letters 
    wordArray.forEach((char, index) => {
      if (char.toLowerCase() === letter.toLowerCase()) {
        displayArray[index] = char;
        correctGuess = true;
      }
    });

    // Return updated display and whether the guess was correct
    return {
      newDisplay: displayArray.join(" "),
      isCorrect: correctGuess,
    };
  };

  // Main game loop - async handles user input promises
  async playGame() {
    // Selects a random word and initialize game state
    const word = this.getRandomWord();
    let display = this.initializeDisplay(word);
    let guessedLetters = new Set(); // Track guessed letters
    let remainingGuesses = 6; // Max incorrect guesses
    let isGameWon = false;

    // Welcome message
    console.log("\n🎮 Welcome to Hangman! 🎲");
    console.log("Press 'ctrl + c' to exit at any time.\n");

    // Game continues until out of guesses or word is guessed
    while (remainingGuesses > 0 && !isGameWon) {
      // Display current game stage
      console.log(this.hangmanStages[6 - remainingGuesses]);
      console.log(`Word: ${display}`);
      console.log(`Guessed Letters: ${Array.from(guessedLetters).join(", ")}`);
      console.log(`Remaining Guesses: ${remainingGuesses}\n`);

      // Prompt for and validate user's guess
      const letter = await this.promptForLetter();

      // Prevent repeated guesses
      if (guessedLetters.has(letter.toLowerCase())) {
        console.log("\n🔁 You've already guessed that letter! Try again.\n");
        continue;
      }

      // Track guessed letters
      guessedLetters.add(letter.toLowerCase());

      // Check if guessed letter is in the word
      const result = this.checkGuess(letter, word, display);

      // Update game based on guess
      if (!result.isCorrect) {
        remainingGuesses--;
        console.log("\n❌ Incorrect guess!\n");
      } else {
        display = result.newDisplay;
        console.log("\n✅ Correct guess!\n");
      }

      // Check if all letters have been revealed (no underscores left)
      if (!display.includes("_")) {
        isGameWon = true;
      }
    }

    // Display final game result and ask to play again
    this.displayGameResult(isGameWon, word);
    await this.playAgain();
  }

  // Prompt user for a letter input and validate
  // Returns a Promise that resolves with a valid letter
  promptForLetter = () => {
    return new Promise((resolve) => {
      this.rl.question("Guess a letter: ", (input) => {
        // Trim whitespace and convert to lowercase
        input = input.trim().toLowerCase();

        // Validate input using regex
        if (this.isValidLetter(input)) {
          resolve(input);
        } else {
          // Prompt again if input is invalid
          console.log("\n🚫 Please enter a valid letter (a-z).\n");
          this.promptForLetter().then(resolve);
        }
      });
    });
  };

  // Use regex to ensure input is a single letter
  // Matches any single character from a-z or A-Z
  isValidLetter = (input) => {
    return /^[a-zA-Z]$/.test(input);
  };

  // Show game result and update win/loss stats
  displayGameResult = (won, word) => {
    // Display final hangman stage
    console.log(this.hangmanStages[6]);

    // Provide outcome based on win/loss
    if (won) {
      this.wins++;
      console.log(`🎉 Congratulations! You guessed the word: ${word}`);
    } else {
      this.losses++;
      console.log(`😢 Game Over! The word was: ${word}`);
    }

    // Show current game stats
    console.log(`\nWins: ${this.wins} | Losses: ${this.losses}`);
  };

  // Prompt to play again using a Promise
  // Allows user to start a new game or exit
  playAgain = () => {
    return new Promise((resolve) => {
      this.rl.question("\nWould you like to play again? (y/n): ", (answer) => {
        if (answer.toLowerCase() === "y") {
          // Start a new game if user chooses 'y'
          this.playGame();
        } else {
          console.log("Thanks for playing! Goodbye.");
          this.rl.close(); // Close readline interface
        }
        resolve();
      });
    });
  };

  // Entry point to start the game
  start = () => {
    this.playGame();
  };
}

// Start the game
const game = new HangmanGame();
game.start();