import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class PauseMenu extends Scene {
  private background: Phaser.GameObjects.Rectangle;
  private menuPanel: Phaser.GameObjects.Container;
  private menuOptions: Phaser.GameObjects.Text[];
  private currentSelection: number = 0;
  private parentScene: Scene | null = null;

  constructor() {
    super({ key: "PauseMenu" });
  }

  init(data: { parentScene?: Scene }) {
    this.parentScene = data.parentScene || null;
  }

  create() {
    this.setupBackground();
    this.setupMenu();
    EventBus.on("esc-key-pressed", () => this.closeMenu());
    EventBus.on("arrow-up-pressed", () => this.changeSelection(-1));
    EventBus.on("arrow-down-pressed", () => this.changeSelection(1));
    EventBus.on("enter-key-pressed", () => this.handleSelect());
    EventBus.emit("current-scene-ready", this);
  }

  private setupBackground() {
    this.background = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(1);
  }

  private setupMenu() {
    this.menuPanel = this.add.container(
      this.scale.width / 2,
      this.scale.height / 2
    );
    this.menuPanel.setDepth(2);

    const panel = this.add
      .nineslice(0, 0, "ui", "dialogueBox", 400, 300, 16, 16, 16, 16)
      .setOrigin(0.5);

    const title = this.add
      .text(0, -100, "Menu", {
        fontSize: "32px",
        fontFamily: "Public Pixel",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const options = ["Resume", "Quit to Menu"];
    this.menuOptions = options.map((option, index) => {
      return this.add
        .text(0, -30 + index * 40, option, {
          fontSize: "20px",
          fontFamily: "Public Pixel",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setAlpha(index === this.currentSelection ? 1 : 0.5);
    });

    this.menuPanel.add([panel, title, ...this.menuOptions]);
  }

  private changeSelection(direction: number) {
    this.menuOptions[this.currentSelection].setAlpha(0.5);
    this.currentSelection =
      (this.currentSelection + direction + this.menuOptions.length) %
      this.menuOptions.length;
    this.menuOptions[this.currentSelection].setAlpha(1);
  }

  private handleSelect() {
    switch (this.currentSelection) {
      case 0: // Resume
        this.closeMenu();
        break;
      case 1: // Quit
        this.scene.start("MainMenu");
        break;
    }
  }

  private closeMenu() {
    if (this.parentScene) {
      this.scene.resume(this.parentScene);
    }
    this.scene.stop();
  }

  shutdown() {
    EventBus.removeListener("esc-key-pressed");
    EventBus.removeListener("arrow-up-pressed");
    EventBus.removeListener("arrow-down-pressed");
    EventBus.removeListener("enter-key-pressed");
  }
}
