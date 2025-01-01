import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";
import WebSocketService from "./WebSocketService";
import { handleGameInput, setCurrentScene } from "./command";

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
      const handleSceneChange = (scene_instance: Phaser.Scene) => {
        sceneRef.current = scene_instance;
        setCurrentScene(scene_instance.scene.key);

        if (currentActiveScene) currentActiveScene(scene_instance);
        if (typeof ref === "function") {
          ref({ game: game.current, scene: scene_instance });
        } else if (ref) {
          ref.current = { game: game.current, scene: scene_instance };
        }
      };

      EventBus.on("current-scene-ready", handleSceneChange);
      EventBus.on("server-response", (data: any) => {
        if (data.game_stage)
          EventBus.emit("game-stage-update", data.game_stage);
        if (data.darkling_wave)
          EventBus.emit("darkling-wave", data.darkling_wave);
      });

      const handleKeyDown = (event: KeyboardEvent) => handleGameInput(event);
      const handleKeyUp = (event: KeyboardEvent) =>
        handleGameInput(event, true);

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        EventBus.removeListener("current-scene-ready", handleSceneChange);
        EventBus.removeListener("server-response");
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [currentActiveScene, ref]);

    return <div id="game-container"></div>;
  }
);
