import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";
import WebSocketService from "./WebSocketService";

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
    const wsService = useRef<WebSocketService | null>(null);

    useLayoutEffect(() => {
      if (game.current === null) {
        game.current = StartGame("game-container");
        wsService.current = WebSocketService.getInstance("game1");

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
      EventBus.on("current-scene-ready", (scene_instance: Phaser.Scene) => {
        sceneRef.current = scene_instance;

        EventBus.on("server-response", (data: any) => {
          if (data.game_stage) {
            EventBus.emit("game-stage-update", data.game_stage);
          }
          if (data.darkling_wave) {
            EventBus.emit("darkling-wave", data.darkling_wave);
          }
        });

        if (currentActiveScene && typeof currentActiveScene === "function") {
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
      });

      const handleKeyDown = (event: KeyboardEvent) => {
        // Menu Controls
        if (event.key === "Enter") {
          EventBus.emit("enter-key-pressed");
        }
        if (event.key === "ArrowUp") {
          EventBus.emit("arrow-up-pressed");
        }
        if (event.key === "ArrowDown") {
          EventBus.emit("arrow-down-pressed");
        }

        // Movement Controls
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          EventBus.emit("run-pressed", event.key);
        }
        if (event.key === " ") {
          // Spacebar
          EventBus.emit("jump-pressed");
        }
        if (event.key === "Shift") {
          EventBus.emit("dash-pressed");
        }
        if (event.key === "Control") {
          EventBus.emit("roll-pressed");
        }

        // Combat Controls
        if (event.key === "z" || event.key === "Z") {
          EventBus.emit("attack-1-pressed");
        }
        if (event.key === "x" || event.key === "X") {
          EventBus.emit("attack-2-pressed");
        }
        if (event.key === "c" || event.key === "C") {
          EventBus.emit("attack-3-pressed");
        }

        // Transform Controls
        if (event.key === "t" || event.key === "T") {
          EventBus.emit("transform-pressed");
        }
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        // Movement Controls Release
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          EventBus.emit("run-released", event.key);
        }
        if (event.key === " ") {
          EventBus.emit("jump-released");
        }
        if (event.key === "Shift") {
          EventBus.emit("dash-released");
        }
        if (event.key === "Control") {
          EventBus.emit("roll-released");
          // Automatically trigger recover balance after roll
          setTimeout(() => {
            EventBus.emit("recover-balance");
          }, 300); // Adjust timing as needed
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        EventBus.removeListener("current-scene-ready");
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [currentActiveScene, ref]);

    return <div id="game-container"></div>;
  }
);
