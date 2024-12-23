import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";
import Architect from "../classes/architect";

export class Intro extends Scene {
  private architect: Architect;
  private dialogue: Array<{ speaker: string; line: string; portrait?: string }>;
  private dialogueIndex: number;
  private dialoguePanel: GameObjects.NineSlice;
  private speakerText: GameObjects.Text;
  private dialogueText: GameObjects.Text;
  private isAnimatingPanel: boolean;
  private portraitImage: GameObjects.Image;

  constructor() {
    super("Intro");
    this.dialogueIndex = 0;
    this.isAnimatingPanel = false;
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    EventBus.removeAllListeners("enter-key-pressed");
    // Load dialogue data
    const dialogueData = this.cache.json.get("dialogue");
    this.dialogue =
      dialogueData.cutscenes.find(
        (cutscene: { phase: string }) =>
          cutscene.phase === "Opening Cutscene (Awakening Phase)"
      )?.dialogue || [];

    // Create architect
    this.architect = new Architect(this, centerX, 200);
    this.architect.sprite.setScale(1.5);

    this.portraitImage = this.add
      .image(840, 520, "elara_portrait")
      .setOrigin(0.5)
      .setScale(0.6)
      .setDepth(1)
      .setAlpha(0);

    // Create dialogue panel
    this.dialoguePanel = this.add
      .nineslice(
        120, // x
        475, // y
        "ui", // texture
        "dialogueBox", // frame
        650, // width
        225, // height
        16, // left
        16, // right
        16, // top
        16 // bottom
      )
      .setOrigin(0, 0)
      .setAlpha(0);

    // Create text elements
    this.speakerText = this.add
      .text(140, 495, "", {
        fontSize: "18px",
        color: "#FFD700",
        fontStyle: "bold",
      })
      .setAlpha(0);

    this.dialogueText = this.add
      .text(140, 525, "", {
        fontSize: "24px",
        color: "#ffffff",
        wordWrap: { width: 630 },
        lineSpacing: 8,
      })
      .setAlpha(0);

    this.playIntroSequence();
    EventBus.emit("current-scene-ready", this);
  }

  private playIntroSequence() {
    this.architect.playAnimation("appear", () => {
      this.architect.playAnimation("idle");
      this.showDialoguePanel(() => {
        this.displayNextDialogue();
      });
    });
  }

  private showDialoguePanel(callback?: () => void) {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.tweens.add({
      targets: [
        this.dialoguePanel,
        this.speakerText,
        this.dialogueText,
        this.portraitImage,
      ],
      alpha: 1,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.isAnimatingPanel = false;
        if (callback) callback();
      },
    });
  }

  private displayNextDialogue() {
    if (this.dialogueIndex < this.dialogue.length) {
      const { speaker, line, portrait } = this.dialogue[this.dialogueIndex];

      this.speakerText.setText(speaker);
      this.dialogueText.setText(line);

      if (portrait) {
        this.portraitImage.setTexture(portrait);
        this.tweens.add({
          targets: this.portraitImage,
          alpha: 1,
          duration: 300,
          ease: "Power2",
        });
      } else {
        this.tweens.add({
          targets: this.portraitImage,
          alpha: 0,
          duration: 300,
          ease: "Power2",
        });
      }

      this.dialogueIndex++;
      this.time.delayedCall(4000, () => this.displayNextDialogue());
    } else {
      this.hideDialoguePanel(() => {
        this.architect.playAnimation("disappear", () => {
          this.changeScene();
        });
      });
    }
  }

  private hideDialoguePanel(callback?: () => void) {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.tweens.add({
      targets: [this.dialoguePanel, this.speakerText, this.dialogueText],
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        this.isAnimatingPanel = false;
        if (callback) callback();
      },
    });
  }

  changeScene() {
    this.scene.start("Platformer");
  }
}
