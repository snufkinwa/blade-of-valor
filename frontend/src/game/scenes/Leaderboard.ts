import { Scene } from "phaser";
import { EventBus } from "../EventBus";

interface LeaderboardEntry {
  gameId: string;
  nickname: string;
  score: number;
  timestamp: string;
}

export class Leaderboard extends Scene {
  private background: Phaser.GameObjects.Rectangle;
  private scores: LeaderboardEntry[] = [];
  private titleText: Phaser.GameObjects.Text;
  private scoreTexts: Phaser.GameObjects.Text[] = [];
  private inputElement: Phaser.GameObjects.DOMElement;
  private submitButton: Phaser.GameObjects.Text;
  private errorText: Phaser.GameObjects.Text;
  private seperator: Phaser.GameObjects.Image;
  private isSubmitting: boolean = false;

  constructor() {
    super("Leaderboard");
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Create semi-transparent background
    this.background = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0);

    // Add title
    this.titleText = this.add
      .text(centerX, 100, "Leaderboard", {
        fontSize: "32px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.seperator = this.add.image(centerX, 145, "seperator").setScale(1.0);

    // Create nickname input field
    const inputField = document.createElement("input");
    inputField.setAttribute("type", "text");
    inputField.setAttribute("placeholder", "Enter nickname");
    inputField.setAttribute("maxlength", "20");
    inputField.style.padding = "8px";
    inputField.style.width = "200px";
    inputField.style.backgroundColor = "#2a2a2a";
    inputField.style.color = "#ffffff";
    inputField.style.border = "1px solid #4a4a4a";
    inputField.style.borderRadius = "4px";
    inputField.style.fontFamily = "Public Pixel, sans-serif";

    this.inputElement = this.add.dom(centerX, 200, inputField);
    this.inputElement.setOrigin(0.5);

    // Add submit button
    this.submitButton = this.add
      .text(centerX, 250, "Submit", {
        fontSize: "20px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
        backgroundColor: "#4a4a4a",
        padding: { x: 15, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.submitButton.setTint(0x7a7a7a))
      .on("pointerout", () => this.submitButton.clearTint())
      .on("pointerdown", () => this.handleSubmit());

    // Add error text (hidden by default)
    this.errorText = this.add
      .text(centerX, 300, "", {
        fontSize: "16px",
        fontFamily: "Public Pixel",
        color: "#ff0000",
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Fetch initial leaderboard data
    this.fetchLeaderboard();

    // Add back button
    const backButton = this.add
      .text(50, 50, "Back", {
        fontSize: "20px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => backButton.setTint(0x7a7a7a))
      .on("pointerout", () => backButton.clearTint())
      .on("pointerdown", () => this.scene.start("MainMenu"));
  }

  private async fetchLeaderboard() {
    try {
      const response = await fetch("/api/leaderboard?limit=10");
      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data = await response.json();
      this.scores = data.leaderboard;
      this.displayScores();
    } catch (err) {
      this.showError("Failed to load leaderboard");
      console.error("Leaderboard fetch error:", err);
    }
  }

  private displayScores() {
    // Clear existing score texts
    this.scoreTexts.forEach((text) => text.destroy());
    this.scoreTexts = [];

    // Display scores
    const startY = 350;
    const spacing = 40;
    const centerX = this.cameras.main.width / 2;

    this.scores.forEach((entry, index) => {
      const scoreText = this.add
        .text(
          centerX,
          startY + index * spacing,
          `${index + 1}. ${entry.nickname} - ${entry.score}`,
          {
            fontSize: "20px",
            fontFamily: "Public Pixel",
            color: index < 3 ? "#ffd700" : "#ffffff",
          }
        )
        .setOrigin(0.5);

      this.scoreTexts.push(scoreText);
    });

    if (this.scores.length === 0) {
      const noScoresText = this.add
        .text(centerX, startY, "No scores yet", {
          fontSize: "20px",
          fontFamily: "Public Pixel",
          color: "#888888",
        })
        .setOrigin(0.5);
      this.scoreTexts.push(noScoresText);
    }
  }

  private async handleSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      // Extract nickname from input field
      const nickname = (
        this.inputElement.getChildByName("input") as HTMLInputElement
      )?.value.trim();
      if (!nickname) {
        this.showError("Nickname cannot be empty");
        this.isSubmitting = false;
        return;
      }

      // Placeholder score for now, replace with actual score if needed
      const score = Math.floor(Math.random() * 100); // Example score generation

      // Submit the score
      const response = await fetch("/submit-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          score,
          timestamp: new Date().toISOString(), // Add timestamp
        }),
      });

      if (!response.ok) throw new Error("Failed to submit score");

      const result = await response.json();
      this.showError(`Score submitted: ${result.score}!`, false);
      await this.fetchLeaderboard(); // Refresh leaderboard

      // Disable submit button interaction after submission
      this.submitButton.removeInteractive().setTint(0x555555);
    } catch (err) {
      this.showError("Failed to submit score");
      console.error("Score submission error:", err);
    } finally {
      this.isSubmitting = false;
    }
  }

  private showError(message: string, isError: boolean = true) {
    this.errorText
      .setText(message)
      .setColor(isError ? "#ff0000" : "#00ff00")
      .setVisible(true);

    this.time.delayedCall(3000, () => {
      this.errorText.setVisible(false);
    });
  }

  shutdown() {
    this.inputElement?.destroy();
    this.scoreTexts.forEach((text) => text.destroy());
  }
}
