import { Physics } from "phaser";
import { EventBus } from "../EventBus";

export class Player extends Physics.Arcade.Sprite {
    protected hp: number = 100;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number
    ) {
        super(scene, x, y, texture, frame);

        // Add player to the scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.getBody().setCollideWorldBounds(true);
        this.setupAnimations(scene);

        // Listen to global events
        this.setupEventListeners();
    }

    private setupAnimations(scene: Phaser.Scene): void {
        const animations = [
            {
                key: "idle",
                prefix: "Idle (Blink)",
                start: 0,
                end: 4,
                repeat: -1,
            },
            {
                key: "lookIntro",
                prefix: "Look (Intro)",
                start: 5,
                end: 11,
                repeat: 0,
            },
            {
                key: "lookBlink",
                prefix: "Look (Blink)",
                start: 12,
                end: 15,
                repeat: 0,
            },
            {
                key: "lookBack",
                prefix: "Look (Back)",
                start: 16,
                end: 19,
                repeat: 0,
            },
            { key: "run", prefix: "Run", start: 20, end: 29, repeat: -1 },
            {
                key: "wallSlide",
                prefix: "Wall Slide",
                start: 30,
                end: 33,
                repeat: -1,
            },
            { key: "dash", prefix: "Dash", start: 34, end: 37, repeat: 0 },
            {
                key: "wallGrab",
                prefix: "Wall Grab",
                start: 38,
                end: 50,
                repeat: -1,
            },
            { key: "jump", prefix: "Jump", start: 51, end: 54, repeat: 0 },
            { key: "fall", prefix: "Fall", start: 55, end: 58, repeat: -1 },
            { key: "roll", prefix: "Roll", start: 59, end: 67, repeat: 0 },
            {
                key: "recoverBalance",
                prefix: "Recover Balance",
                start: 68,
                end: 78,
                repeat: 0,
            },
            {
                key: "attack1",
                prefix: "Attack 1",
                start: 79,
                end: 88,
                repeat: 0,
            },
            {
                key: "attack2",
                prefix: "Attack 2",
                start: 89,
                end: 98,
                repeat: 0,
            },
            {
                key: "attack3",
                prefix: "Attack 3",
                start: 99,
                end: 109,
                repeat: 0,
            },
            { key: "turn", prefix: "Turn", start: 110, end: 130, repeat: 0 },
            {
                key: "transformBefore",
                prefix: "Transform (Before)",
                start: 131,
                end: 155,
                repeat: 0,
            },
            {
                key: "transformAfter",
                prefix: "Transform (After)",
                start: 156,
                end: 168,
                repeat: 0,
            },
        ];

        animations.forEach((anim) => {
            scene.anims.create({
                key: anim.key,
                frames: scene.anims.generateFrameNames("player", {
                    prefix: anim.prefix,
                    start: anim.start,
                    end: anim.end,
                }),
                frameRate: 10, // Adjust this value for faster/slower animations
                repeat: anim.repeat,
            });
        });
    }

    private setupEventListeners(): void {
        EventBus.on("move-left", () => this.handleMove(-160));
        EventBus.on("move-right", () => this.handleMove(160));
        EventBus.on("jump", () => this.handleJump());
        EventBus.on("roll", () => this.play("roll", true));
        EventBus.on("enter-key-pressed", () => this.play("idle", true));
    }

    private handleMove(velocity: number): void {
        const body = this.getBody();
        body.setVelocityX(velocity);
        this.play("run", true);
        this.checkFlip(velocity);
    }

    private handleJump(): void {
        const body = this.getBody();
        if (body.blocked.down) {
            body.setVelocityY(-300);
            this.play("jump", true);
        }
    }

    private checkFlip(velocity: number): void {
        this.setFlipX(velocity < 0);
    }

    public getDamage(value: number): void {
        this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: 3,
            yoyo: true,
            alpha: 0.5,
            onStart: () => (this.hp -= value),
            onComplete: () => this.setAlpha(1),
        });
    }

    private getBody(): Physics.Arcade.Body {
        return this.body as Physics.Arcade.Body;
    }
}

