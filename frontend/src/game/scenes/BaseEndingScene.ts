import { Scene, GameObjects } from "phaser";
import { EventBus } from "../EventBus";

export abstract class BaseEndingScene extends Scene {
  protected background: GameObjects.Image;
  protected dialoguePanel: GameObjects.NineSlice;
  protected speakerText: GameObjects.Text;
  protected dialogueText: GameObjects.Text;
  protected dialogueIndex: number = 0;
  protected dialogue: Array<{
    speaker: string;
    line: string;
    portrait?: string;
  }> = [];
  protected portraitContainer: GameObjects.Container;
  protected currentPortrait: GameObjects.Image | null = null;
  protected isAnimatingPanel: boolean = false;
  protected seperator: GameObjects.Image;

  constructor(sceneKey: string) {
    super(sceneKey);
  }

  create() {
    this.generateParticleTexture();
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Create background with purple/pink gradient
    this.background = this.add
      .image(centerX, centerY, "ending-background")
      .setTint(0x9932cc); // Deep purple base tint

    // Add glow effect
    const glowGraphics = this.add
      .graphics()
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: glowGraphics,
      alpha: { from: 0.4, to: 0.6 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Create dialogue panel with stylized border
    this.dialoguePanel = this.add
      .nineslice(
        centerX - 325,
        centerY - 100,
        "ui",
        "dialogueBox",
        650,
        200,
        16,
        16,
        16,
        16
      )
      .setAlpha(0);

    this.seperator = this.add
      .image(centerX, centerY - 120, "seperator")
      .setScale(1.0)
      .setAlpha(0);

    // Create portrait container
    this.portraitContainer = this.add.container(centerX + 250, centerY - 50);

    // Create text elements with stylized font
    this.speakerText = this.add
      .text(centerX - 305, centerY - 80, "", {
        fontFamily: "Rover Cloxe",
        fontSize: "24px",
        color: "#FFD700",
        fontStyle: "bold",
      })
      .setAlpha(0);

    this.dialogueText = this.add
      .text(centerX - 305, centerY - 40, "", {
        fontFamily: "Rover Cloxe",
        fontSize: "20px",
        color: "#ffffff",
        wordWrap: { width: 500 },
        lineSpacing: 8,
      })
      .setAlpha(0);

    // Load dialogue specific to ending
    this.loadDialogue();
    this.showDialoguePanel(() => {
      this.displayNextDialogue();
    });
  }

  protected abstract loadDialogue(): void;

  protected showDialoguePanel(callback?: () => void): void {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.tweens.add({
      targets: [
        this.dialoguePanel,
        this.speakerText,
        this.dialogueText,
        this.seperator,
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

  protected hideDialoguePanel(callback?: () => void): void {
    if (this.isAnimatingPanel) return;
    this.isAnimatingPanel = true;

    this.tweens.add({
      targets: [
        this.dialoguePanel,
        this.speakerText,
        this.dialogueText,
        this.seperator,
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

  protected generateParticleTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("particle", 8, 8);
    graphics.destroy();
  }

  protected createParticles(
    x: number,
    y: number,
    config?: Partial<Phaser.Types.GameObjects.Particles.ParticleEmitterConfig>
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const defaultConfig = {
      lifespan: 2000,
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      emitting: true,
      frequency: 100,
    };

    return this.add.particles(0, 0, "particle", {
      x,
      y,
      ...defaultConfig,
      ...config,
    });
  }

  protected displayNextDialogue(): void {
    if (this.dialogueIndex < this.dialogue.length) {
      const { speaker, line, portrait } = this.dialogue[this.dialogueIndex];

      // Update text
      this.speakerText.setText(speaker);
      this.dialogueText.setText(line);

      // Handle portrait changes
      if (portrait) {
        if (this.currentPortrait) {
          this.tweens.add({
            targets: this.currentPortrait,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              this.currentPortrait?.destroy();
              this.showNewPortrait(portrait);
            },
          });
        } else {
          this.showNewPortrait(portrait);
        }
      }

      this.dialogueIndex++;
      this.time.delayedCall(4000, () => this.displayNextDialogue());
    } else {
      this.hideDialoguePanel(() => {
        this.cameras.main.fadeOut(1000);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("MainMenu");
        });
      });
    }
  }

  private showNewPortrait(portrait: string): void {
    this.currentPortrait = this.add
      .image(0, 0, portrait)
      .setScale(0.6)
      .setAlpha(0);

    this.portraitContainer.add(this.currentPortrait);

    this.tweens.add({
      targets: this.currentPortrait,
      alpha: 1,
      duration: 200,
    });
  }
}
