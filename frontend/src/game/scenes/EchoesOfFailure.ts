import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";

export class EchoesOfFailure extends Scene {
  private dialogue: Array<{ speaker: string; line: string }>;
  private dialogueIndex: number;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private background: Phaser.GameObjects.Image;
  private dialogueText: Phaser.GameObjects.Text;
  private speakerText: Phaser.GameObjects.Text;

  constructor() {
    super("EchoesOfFailure");
    this.dialogueIndex = 1; // Start from index 1
  }

  create() {
    this.camera = this.cameras.main;
    const { centerX, centerY } = this.cameras.main;

    // Load dialogue data
    const dialogueData = this.cache.json.get("dialogue");
    this.dialogue =
      dialogueData.cutscenes.find(
        (cutscene: { phase: string }) =>
          cutscene.phase === "First Darkling Encounter"
      )?.dialogue || [];

    console.log("Starting Dialogue Sequence");
    console.log("Total Dialogues:", this.dialogue.length);

    // Create background with fade in
    this.background = this.add
      .image(centerX, centerY, "darklingBG")
      .setScale(0.7)
      .setAlpha(0);

    this.tweens.add({
      targets: this.background,
      alpha: 1,
      duration: 1000,
    });

    // Create speaker name text - positioned on the left
    this.speakerText = this.add
      .text(140, 100, "", {
        fontFamily: "Public Pixel",
        fontSize: 28,
        align: "left",
        color: "#FFFFFF",
      })
      .setOrigin(0, 0);

    // Create dialogue text
    this.dialogueText = this.add
      .text(140, 150, "", {
        fontFamily: "Too Much Ink",
        fontSize: 24,
        color: "#FFFFFF",
        align: "left",
        wordWrap: { width: 620 },
      })
      .setOrigin(0, 0);

    EventBus.emit("current-scene-ready", this);

    // Start dialogue after a short delay
    this.time.delayedCall(1000, () => {
      this.displayNextDialogue();
    });
  }

  private displayNextDialogue() {
    if (this.dialogueIndex < this.dialogue.length) {
      const { speaker, line } = this.dialogue[this.dialogueIndex];
      console.log(
        `Speaker: ${speaker}, Line: ${line}, Index: ${this.dialogueIndex}`
      );

      const isDarklings = speaker === "Darklings";

      // Set font styles based on speaker
      this.speakerText
        .setStyle({
          fontFamily: isDarklings ? "Too Much Ink" : "Public Pixel",
          fontSize: 28,
          color: "#FFFFFF",
        })
        .setText(speaker);

      this.dialogueText
        .setStyle({
          fontFamily: isDarklings ? "Too Much Ink" : "Public Pixel",
          fontSize: 24,
          color: "#FFFFFF",
          align: "left",
          wordWrap: { width: 680 },
        })
        .setText(line);

      // Progress to next dialogue after delay
      this.dialogueIndex++;
      this.time.delayedCall(4000, () => {
        this.displayNextDialogue();
      });
    } else {
      console.log("Dialogue Sequence Completed. Changing Scene.");
      this.changeScene();
    }
  }

  changeScene() {
    this.cameras.main.fadeOut(1000);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Corruption");
    });
  }

  shutdown() {
    this.tweens.killAll();
  }
}
