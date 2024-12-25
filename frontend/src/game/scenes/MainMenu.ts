import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
  background: GameObjects.Image;
  duelimg: GameObjects.Image;
  logo: GameObjects.Image;
  selectionHighlight: GameObjects.Image;
  seperator: GameObjects.Image;
  menuOptions: GameObjects.Text[];
  leftArrow: GameObjects.Image;
  rightArrow: GameObjects.Image;
  currentSelection: number = 0;

  constructor() {
    super("MainMenu");
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Background elements
    this.background = this.add.image(centerX, centerY, "background");
    this.duelimg = this.add.image(centerX, 454, "duelimg");
    this.logo = this.add.image(513, 354, "logoimg");
    //this.seperator = this.add.image(centerX, 480, "seperator").setScale(1.0);
    this.seperator = this.add
      .image(centerX, 645, "seperator")
      .setScale(1.0)
      .setFlipY(true);

    // Selection highlight background
    this.selectionHighlight = this.add
      .image(centerX, 520, "popup-bg")
      .setScale(1.1);

    // Menu options
    const options = ["New Game", "Continue", "Tutorial"];
    this.menuOptions = options.map((option, index) => {
      return this.add
        .text(centerX, 520 + index * 40, option, {
          fontFamily: "Public Pixel",
          fontSize: 16,
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5)
        .setAlpha(index === this.currentSelection ? 1 : 0.5);
    });

    // Selection arrows
    this.leftArrow = this.add
      .image(centerX - 100, 520, "arrow-left")
      .setScale(0.8);
    this.rightArrow = this.add
      .image(centerX + 100, 520, "arrow-right")
      .setScale(0.8);

    this.tweens.add({
      targets: this.leftArrow,
      x: "-=5",
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: this.rightArrow,
      x: "+=5",
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.updateSelectionVisuals();

    // Setup input handlers
    EventBus.on("arrow-up-pressed", () => this.changeSelection(-1));
    EventBus.on("arrow-down-pressed", () => this.changeSelection(1));
    EventBus.on("enter-key-pressed", this.handleEnterKey, this);

    EventBus.emit("current-scene-ready", this);
  }

  changeSelection(direction: number) {
    // Update current selection
    this.currentSelection =
      (this.currentSelection + direction + this.menuOptions.length) %
      this.menuOptions.length;
    this.updateSelectionVisuals();
  }

  updateSelectionVisuals() {
    // Update menu option alphas
    this.menuOptions.forEach((option, index) => {
      option.setAlpha(index === this.currentSelection ? 1 : 0.5);
    });

    // Update highlight and arrow positions
    const targetY = 520 + this.currentSelection * 40;
    this.selectionHighlight.setPosition(this.selectionHighlight.x, targetY);
    this.leftArrow.setPosition(this.leftArrow.x, targetY);
    this.rightArrow.setPosition(this.rightArrow.x, targetY);
  }

  handleEnterKey() {
    console.log("Enter key pressed");
    this.cameras.main.fadeOut(500, 0, 0, 0); // Fade out effect
    this.cameras.main.once("camerafadeoutcomplete", () => {
      switch (this.currentSelection) {
        case 0: // New Game
          this.scene.start("Intro");
          break;
        case 1: // Continue
          // TODO: Add continue game logic
          this.scene.start("Intro"); // Temporary
          break;
        case 2: // Tutorial
          this.scene.start("Tutorial");
          break;
      }
    });
  }

  shutdown() {
    EventBus.removeListener("enter-key-pressed", this.handleEnterKey);
    EventBus.removeListener("arrow-up-pressed", () => this.changeSelection(-1));
    EventBus.removeListener("arrow-down-pressed", () =>
      this.changeSelection(1)
    );
  }
}
