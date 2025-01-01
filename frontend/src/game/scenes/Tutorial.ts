import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Tutorial extends Scene {
  private background: Phaser.GameObjects.Rectangle;
  private tutorialPanel: Phaser.GameObjects.Container;
  private closeButton: Phaser.GameObjects.Text;
  private seperator: Phaser.GameObjects.Image;
  private parentScene: Scene | null = null;
  private onClose: (() => void) | null = null;

  constructor() {
    super({ key: "Tutorial" });
  }

  init(data: { parentScene?: Scene; onClose?: () => void }) {
    this.parentScene = data.parentScene || null;
    this.onClose = data.onClose || null;
  }

  create() {
    this.setupBackground();
    this.setupPanel();
    EventBus.on("esc-key-pressed", () => this.closeTutorial());
    EventBus.emit("current-scene-ready", this);
  }

  private setupBackground() {
    this.background = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(1);
  }

  private setupPanel() {
    this.tutorialPanel = this.add.container(
      this.scale.width / 2,
      this.scale.height / 2
    );
    this.tutorialPanel.setDepth(2);

    this.seperator = this.add.image(0, -145, "seperator").setScale(1.0);

    const panel = this.add
      .nineslice(0, 0, "ui", "dialogueBox", 600, 500, 16, 16, 16, 16)
      .setOrigin(0.5);

    const title = this.add
      .text(0, -190, "Tutorial", {
        fontSize: "24px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const content = this.add
      .text(
        0,
        0,
        "Controls:\n\n" +
          "Arrow Keys  -  Move\n" +
          "Space       -  Jump\n" +
          "Z           -  Light Attack\n" +
          "X           -  Heavy Attack\n" +
          "C           -  Special Attack\n" +
          "Q           -  Dash\n" +
          "R           -  Roll\n" +
          "T           -  Transform",
        {
          fontSize: "16px",
          fontFamily: "Public Pixel",
          color: "#ffffff",
          align: "left",
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);

    this.closeButton = this.add
      .text(0, 200, "Close [Esc]", {
        fontSize: "20px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.tutorialPanel.add([
      title,
      this.seperator,
      content,
      this.closeButton,
      panel,
    ]);
  }

  private closeTutorial() {
    if (this.onClose) {
      this.onClose();
    }
    if (this.parentScene) {
      this.scene.resume(this.parentScene);
    }
    this.scene.stop();
  }

  shutdown() {
    EventBus.removeListener("esc-key-pressed");
  }
}
