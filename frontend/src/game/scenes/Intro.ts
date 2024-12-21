import { EventBus } from "../EventBus";
import { GameObjects, Scene, Animations } from "phaser";
import Architect from "../classes/architect";

export class Intro extends Scene {
  architect: Architect;
  dialogue: Array<{ speaker: string; line: string }>;
  dialogueIndex: number;
  dialogePanel: GameObjects.Image;
  textBox: GameObjects.Text;

  constructor() {
    super("Intro");
    this.dialogueIndex = 0;
  }

  create() {
    // Create environment and characters
    const dialogueData = this.cache.json.get("dialogue");
    this.dialogue =
      dialogueData.cutscenes.find(
        (cutscene: { phase: string }) =>
          cutscene.phase === "Opening Cutscene (Awakening Phase)"
      )?.dialogue || [];

    this.architect = new Architect(this, 500, 200);

    this.architect.sprite.play("appear");
    this.architect.sprite.setScale(1.5);

    this.textBox = this.add.text(120, 500, "", {
      fontSize: "24px",
      color: "#ffffff",
      wordWrap: { width: 800 },
      align: "center",
    });

    this.playIntroSequence();

    EventBus.emit("current-scene-ready", this);
  }

  playIntroSequence() {
    this.architect.playAnimation("appear");
    this.time.delayedCall(2000, () => {
      this.architect.playAnimation("idle");
      this.displayNextDialogue();
    });
  }

  displayNextDialogue() {
    if (this.dialogueIndex < this.dialogue.length) {
      const { speaker, line } = this.dialogue[this.dialogueIndex];
      this.textBox.setText(`${speaker}: ${line}`);
      this.dialogueIndex++;
      this.time.delayedCall(3000, () => this.displayNextDialogue());
    } else {
      this.textBox.setText("");
      this.architect.playAnimation("disappear");
      this.time.delayedCall(2000, () => this.changeScene());
    }
  }

  update() {
    // Update logic
  }

  changeScene() {
    this.scene.start("Platformer");
  }
}
