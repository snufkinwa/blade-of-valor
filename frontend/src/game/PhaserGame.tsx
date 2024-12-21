import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps {
    currentActiveScene?: (scene_instance: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
    function PhaserGame({ currentActiveScene }, ref) {
        const game = useRef<Phaser.Game | null>(null);
        const sceneRef = useRef<Phaser.Scene | null>(null);

        useLayoutEffect(() => {
            if (game.current === null) {
                game.current = StartGame("game-container");
                if (typeof ref === "function") {
                    ref({ game: game.current, scene: null });
                } else if (ref) {
                    ref.current = { game: game.current, scene: null };
                }
            }

            return () => {
                if (game.current) {
                    game.current.destroy(true);
                    game.current = null;
                }
            };
        }, [ref]);

        useEffect(() => {
            EventBus.on(
                "current-scene-ready",
                (scene_instance: Phaser.Scene) => {
                    sceneRef.current = scene_instance;
                    if (
                        currentActiveScene &&
                        typeof currentActiveScene === "function"
                    ) {
                        currentActiveScene(scene_instance);
                    }
                    if (typeof ref === "function") {
                        ref({ game: game.current, scene: scene_instance });
                    } else if (ref) {
                        ref.current = {
                            game: game.current,
                            scene: scene_instance,
                        };
                    }
                }
            );

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Enter" && sceneRef.current) {
                    // Emit an event that the Phaser scene can listen to
                    EventBus.emit("enter-key-pressed");
                }
            };

            window.addEventListener("keydown", handleKeyDown);

            return () => {
                EventBus.removeListener("current-scene-ready");
                window.removeEventListener("keydown", handleKeyDown);
            };
        }, [currentActiveScene, ref]);

        return <div id="game-container"></div>;
    }
);
