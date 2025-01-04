import { EventBus } from "../EventBus";
import Darkling from "../classes/darkling";
import { BaseScene } from "./BaseScene";

export class IntroScene extends BaseScene {
  private introDarkling: Darkling | null = null;
  private introTriggered: boolean = false;
  private dialoguePanel: Phaser.GameObjects.Container;

  constructor() {
    super("IntroScene");
  }

  create() {
    super.create();
    this.setupIntroDarklingArea();
    this.createDialoguePanel();
  }

  private setupIntroDarklingArea() {
    const x = 800;
    const y = 785;
    const width = 80;
    const height = 100;

    const cage = {
      platform: this.add.rectangle(x, y + 40, width, 10),
      leftWall: this.add.rectangle(x - width / 2, y, 10, height),
      rightWall: this.add.rectangle(x + width / 2, y, 10, height),
      ceiling: this.add.rectangle(x, y - height / 2, width, 10),
    };

    Object.values(cage).forEach((part) => {
      this.physics.add.existing(part, true);
    });

    this.introDarkling = new Darkling(this, x, y);
    this.darklings.add(this.introDarkling);
    this.physics.add.collider(this.introDarkling, Object.values(cage));

    // Create visible trigger zone for debugging
    const triggerZone = this.add.rectangle(
      x - 10,
      y,
      20,
      height,
      0xff0000,
      0.3
    );
    this.physics.add.existing(triggerZone, true);

    // Check player's vertical velocity in overlap
    this.physics.add.overlap(this.player, triggerZone, () => {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (!this.introTriggered && Math.abs(playerBody.velocity.y) < 50) {
        this.startIntroSequence();
      }
    });
  }

  private createDialoguePanel() {
    this.dialoguePanel = this.add.container(0, 0).setDepth(1000);

    const panel = this.add
      .nineslice(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "ui",
        "dialogueBox",
        600,
        100,
        16,
        16,
        16,
        16
      )
      .setOrigin(0.5)
      .setAlpha(0);

    const speakerText = this.add.text(
      this.cameras.main.centerX - 280,
      this.cameras.main.height - 185,
      "",
      {
        fontSize: "18px",
        color: "#FFD700",
        fontStyle: "bold",
      }
    );

    const dialogueText = this.add.text(
      this.cameras.main.centerX - 280,
      this.cameras.main.height - 160,
      "",
      {
        fontSize: "16px",
        color: "#ffffff",
        wordWrap: { width: 560 },
      }
    );

    this.dialoguePanel.add([panel, speakerText, dialogueText]);
    this.dialoguePanel.setAlpha(0);
  }

  private async startIntroSequence() {
    this.introTriggered = true;
    EventBus.emit("disable-controls");
    this.physics.pause();

    if (this.player && this.introDarkling) {
      this.player.setFlipX(this.player.x > this.introDarkling.x);
      this.introDarkling.attack();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.showDialogue("Elara", "The shadows... they're moving...");
      await this.showDialogue("???", "Your light... it calls to us...");
      await this.showDialogue("Elara", "Stay back! What are you?!");

      this.cameras.main.fadeOut(1000);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("EchoesOfFailure");
      });
    }
  }

  private showDialogue(speaker: string, text: string): Promise<void> {
    return new Promise((resolve) => {
      const [panel, speakerText, dialogueText] = this.dialoguePanel.list as [
        Phaser.GameObjects.NineSlice,
        Phaser.GameObjects.Text,
        Phaser.GameObjects.Text
      ];

      speakerText.setText(speaker);
      dialogueText.setText(text);

      this.tweens.add({
        targets: this.dialoguePanel,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          this.time.delayedCall(3000, () => {
            this.tweens.add({
              targets: this.dialoguePanel,
              alpha: 0,
              duration: 300,
              onComplete: () => resolve(),
            });
          });
        },
      });
    });
  }
}
