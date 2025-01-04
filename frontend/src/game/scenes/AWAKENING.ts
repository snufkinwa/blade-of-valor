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
    this.createIntroDarkling();
    this.createDialoguePanel();
    EventBus.emit("current-scene-ready", this);
  }

  private createDialoguePanel(): void {
    this.dialoguePanel = this.add.container(0, 0);
    this.dialoguePanel.setDepth(1000);

    // Create the dialogue box background
    const panel = this.add.nineslice(
      this.cameras.main.centerX,
      this.cameras.main.height - 150,
      "ui",
      "dialogueBox",
      600,
      100,
      16,
      16,
      16,
      16
    );
    panel.setOrigin(0.5);
    panel.setAlpha(0);

    // Create text elements
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

  private createIntroDarkling(): void {
    const introDarklingX = 800;
    const introDarklingY = 785;

    // Create invisible platform and walls
    const cagePlatform = this.add.rectangle(
      introDarklingX,
      introDarklingY + 40,
      80,
      10
    );
    this.physics.add.existing(cagePlatform, true);

    const leftWall = this.add.rectangle(
      introDarklingX - 10,
      introDarklingY,
      10,
      80
    );
    const rightWall = this.add.rectangle(
      introDarklingX + 40,
      introDarklingY,
      10,
      80
    );

    this.physics.add.existing(leftWall, true);
    this.physics.add.existing(rightWall, true);

    this.introDarkling = new Darkling(this, introDarklingX, introDarklingY);
    this.darklings.add(this.introDarkling);

    const body = this.introDarkling.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1000);

    this.physics.add.collider(this.introDarkling, [
      cagePlatform,
      leftWall,
      rightWall,
    ]);

    this.physics.add.overlap(
      this.player,
      this.introDarkling,
      this.handleIntroOverlap,
      undefined,
      this
    );

    this.introDarkling.setPlayer(this.player);
  }

  private showDialogue(speaker: string, text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const panel = this.dialoguePanel.getAt(0) as Phaser.GameObjects.NineSlice;
      const speakerText = this.dialoguePanel.getAt(
        1
      ) as Phaser.GameObjects.Text;
      const dialogueText = this.dialoguePanel.getAt(
        2
      ) as Phaser.GameObjects.Text;

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
              onComplete: () => {
                resolve();
              },
            });
          });
        },
      });
    });
  }

  private playPlayerAnimation(animKey: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.player) {
        resolve();
        return;
      }

      this.player.play(animKey, true).once("animationcomplete", () => {
        resolve();
      });
    });
  }

  private async handleIntroOverlap() {
    if (!this.introTriggered && this.player && this.introDarkling) {
      this.introTriggered = true;
      this.physics.pause();

      const playerDirection = this.player.x > (this.introDarkling?.x ?? 0);
      this.player.setFlipX(playerDirection);

      // Play initial animations
      await this.playPlayerAnimation("lookIntro");
      await this.playPlayerAnimation("lookBlink");

      // Show dialogue sequence
      await this.showDialogue("Elara", "The shadows... they're moving...");
      await this.showDialogue("???", "Your light... it calls to us...");
      await this.showDialogue("Elara", "Stay back! What are you?!");

      // Transition to next scene
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("EchoesOfFailure");
      });
    }
  }

  update() {
    super.update();

    // Add any additional update logic specific to the intro scene
    if (this.introDarkling && !this.introTriggered) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.introDarkling.x,
        this.introDarkling.y
      );

      if (distance < 200) {
        this.introDarkling.setFlipX(this.introDarkling.x > this.player.x);
      }
    }
  }
}
