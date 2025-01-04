import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";

export class Intro extends Scene {
  private dialogue: Array<{ speaker: string; line: string }>;
  private dialogueIndex: number;
  private elaraPanel: GameObjects.NineSlice;
  private architectPanel: GameObjects.NineSlice;
  private elaraSpeakerText: GameObjects.Text;
  private elaraDialogueText: GameObjects.Text;
  private architectSpeakerText: GameObjects.Text;
  private architectDialogueText: GameObjects.Text;
  private elaraPortrait: GameObjects.Image;
  private architectPortrait: GameObjects.Sprite;
  private isAnimatingPanel: boolean;
  private isNewGame: boolean;
  private onIntroComplete: Function | null;

  constructor() {
    super("Intro");
    this.dialogueIndex = 0;
    this.isAnimatingPanel = false;
  }

  create(data: { isNewGame: boolean; onIntroComplete: null }) {
    this.isNewGame = data.isNewGame ?? false;
    this.onIntroComplete = data.onIntroComplete || null;

    EventBus.removeAllListeners("enter-key-pressed");

    // Load dialogue data
    const dialogueData = this.cache.json.get("dialogue");
    this.dialogue =
      dialogueData.cutscenes.find(
        (cutscene: { phase: string }) =>
          cutscene.phase === "Opening Cutscene (Awakening Phase)"
      )?.dialogue || [];

    // Create animations for Architect
    this.anims.create({
      key: "architect_talk",
      frames: this.anims.generateFrameNames("architect_portrait", {
        prefix: "sprite",
        start: 72,
        end: 101,
      }),
      frameRate: 15,
      repeat: -1,
    });

    // Create panels for Elara and Architect
    this.elaraPanel = this.add
      .nineslice(120, 100, "ui", "dialogueBox", 650, 200, 16, 16, 16, 16)
      .setOrigin(0, 0)
      .setAlpha(0);

    this.architectPanel = this.add
      .nineslice(240, 380, "ui", "dialogueBox", 650, 200, 16, 16, 16, 16)
      .setOrigin(0, 0)
      .setAlpha(0);

    // Create portraits
    this.elaraPortrait = this.add
      .image(920, 200, "elara_portrait")
      .setOrigin(0.5)
      .setScale(0.6)
      .setDepth(1)
      .setAlpha(0);

    this.architectPortrait = this.add
      .sprite(140, 480, "architect_portrait", "sprite72")
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0);

    // Create a circular mask
    const maskGraphics = this.add.graphics();
    maskGraphics.beginPath();
    maskGraphics.arc(140, 480, 60, 0, Math.PI * 2, false); // Circular mask with a radius of 75
    maskGraphics.fill();

    // Apply the mask to the architectPortrait
    const mask = maskGraphics.createGeometryMask();
    this.architectPortrait.setMask(mask);

    // Create text elements
    this.elaraSpeakerText = this.addText(140, 120, "", 18, "#FFD700", "bold");
    this.elaraDialogueText = this.addText(140, 150, "", 24, "#ffffff");

    this.architectSpeakerText = this.addText(
      260,
      400,
      "",
      18,
      "#FFD700",
      "bold"
    );
    this.architectDialogueText = this.addText(260, 430, "", 24, "#ffffff");

    this.showDialoguePanel(() => {
      this.displayNextDialogue();
    });
  }

  private addText(
    x: number,
    y: number,
    content: string,
    fontSize: number,
    color: string,
    fontStyle?: string
  ) {
    return this.add
      .text(x, y, content, {
        fontSize: `${fontSize}px`,
        color,
        fontStyle,
        wordWrap: { width: 600 },
        lineSpacing: 8,
      })
      .setAlpha(0);
  }

  private showDialoguePanel(callback?: () => void) {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.tweens.add({
      targets: [
        this.elaraPanel,
        this.architectPanel,
        this.elaraSpeakerText,
        this.elaraDialogueText,
        this.architectSpeakerText,
        this.architectDialogueText,
        this.elaraPortrait,
        this.architectPortrait,
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
      const { speaker, line } = this.dialogue[this.dialogueIndex];

      this.clearDialogueBoxes();

      if (speaker.toLowerCase() === "elara") {
        this.elaraSpeakerText.setText(speaker);
        this.elaraDialogueText.setText(line);
        this.elaraPortrait.setAlpha(1);
        this.architectPortrait.setAlpha(0.5);
        this.architectPortrait.stop(); // Stop Architect's animation
        this.architectPortrait.setFrame("sprite72"); // Reset to the first frame
      } else if (speaker.toLowerCase() === "architect") {
        this.architectSpeakerText.setText(speaker);
        this.architectDialogueText.setText(line);
        this.architectPortrait.setAlpha(1);
        this.elaraPortrait.setAlpha(0.5);
        this.architectPortrait.play("architect_talk"); // Play Architect's animation
      }

      this.dialogueIndex++;
      this.time.delayedCall(4000, () => this.displayNextDialogue());
    } else {
      this.hideDialoguePanel(() => {
        this.changeScene();
      });
    }
  }

  private clearDialogueBoxes() {
    this.elaraSpeakerText.setText("");
    this.elaraDialogueText.setText("");
    this.architectSpeakerText.setText("");
    this.architectDialogueText.setText("");
  }

  private hideDialoguePanel(callback?: () => void) {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.architectPortrait.stop();

    this.tweens.add({
      targets: [
        this.elaraPanel,
        this.architectPanel,
        this.elaraSpeakerText,
        this.elaraDialogueText,
        this.architectSpeakerText,
        this.architectDialogueText,
        this.elaraPortrait,
        this.architectPortrait,
      ],
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
    if (this.onIntroComplete) {
      this.onIntroComplete();
    } else {
      this.scene.start("IntroScene", { isNewGame: this.isNewGame });
    }
  }
}
