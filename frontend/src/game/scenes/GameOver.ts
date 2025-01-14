export class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create(data: { reason: string }) {
    // Display a "Game Over" title
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      "Game Over",
      {
        font: "48px Arial",
        color: "#ff0000",
        align: "center",
      }
    );
    title.setOrigin(0.5);

    // Display the reason for the game over
    const reasonText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `Reason: ${data.reason}`,
      {
        font: "24px Arial",
        color: "#ffffff",
        align: "center",
      }
    );
    reasonText.setOrigin(0.5);

    // Add a "Restart" button
    const restartButton = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 100,
      "Restart Game",
      {
        font: "32px Arial",
        color: "#00ff00",
        align: "center",
      }
    );
    restartButton.setOrigin(0.5).setInteractive();

    // Restart the game when the button is clicked
    restartButton.on("pointerdown", () => {
      this.scene.start("MainGameScene"); // Replace with your main game scene's key
    });
  }
}
