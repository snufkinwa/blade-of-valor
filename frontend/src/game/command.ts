import { EventBus } from "./EventBus";

type GameCommand = {
  GLOBAL: {
    ESC: string;
    F1: string;
  };
  MENU: {
    ENTER: string;
    UP: string;
    DOWN: string;
  };
  GAMEPLAY: {
    MOVEMENT: {
      RUN: string;
      RUN_RELEASE: string;
      JUMP: string;
      JUMP_RELEASE: string;
      DASH: string;
      DASH_RELEASE: string;
      ROLL: string;
      RECOVER: string;
    };
    COMBAT: {
      ATTACK_1: string;
      ATTACK_2: string;
      ATTACK_3: string;
    };
  };
};

export const GameCommands: GameCommand = {
  GLOBAL: {
    ESC: "esc-key-pressed",
    F1: "f1-key-pressed",
  },
  MENU: {
    ENTER: "enter-key-pressed",
    UP: "arrow-up-pressed",
    DOWN: "arrow-down-pressed",
  },
  GAMEPLAY: {
    MOVEMENT: {
      RUN: "run-pressed",
      RUN_RELEASE: "run-released",
      JUMP: "jump-pressed",
      JUMP_RELEASE: "jump-released",
      DASH: "dash-pressed",
      DASH_RELEASE: "dash-released",
      ROLL: "roll-pressed",
      RECOVER: "recover-balance",
    },
    COMBAT: {
      ATTACK_1: "attack-1-pressed",
      ATTACK_2: "attack-2-pressed",
      ATTACK_3: "attack-3-pressed",
    },
  },
};

let currentScene: string = "MainMenu";

export const setCurrentScene = (sceneName: string) => {
  currentScene = sceneName;
};

export const resetCurrentScene = () => {
  currentScene = "MainMenu";
};

export const handleGameInput = (
  event: KeyboardEvent,
  isKeyUp = false
): void => {
  const { key } = event;

  // Global commands that work everywhere
  if (!isKeyUp) {
    if (key === "Escape") EventBus.emit(GameCommands.GLOBAL.ESC);
    if (key === "F1") EventBus.emit(GameCommands.GLOBAL.F1);
  }

  // Scene-specific commands
  switch (currentScene) {
    case "MainMenu":
      if (!isKeyUp) {
        if (key === "Enter") EventBus.emit(GameCommands.MENU.ENTER);
        if (key === "ArrowUp") EventBus.emit(GameCommands.MENU.UP);
        if (key === "ArrowDown") EventBus.emit(GameCommands.MENU.DOWN);
      }
      break;
    case "IntroScene":
    case "Intro":
    case "Corruption":
    case "FinalBattle":
      // Movement controls
      if (key === "ArrowRight" || key === "ArrowLeft") {
        EventBus.emit(
          isKeyUp
            ? GameCommands.GAMEPLAY.MOVEMENT.RUN_RELEASE
            : GameCommands.GAMEPLAY.MOVEMENT.RUN,
          key
        );
      }
      if (key === " ") {
        EventBus.emit(
          isKeyUp
            ? GameCommands.GAMEPLAY.MOVEMENT.JUMP_RELEASE
            : GameCommands.GAMEPLAY.MOVEMENT.JUMP
        );
      }
      if (key.toLowerCase() === "q") {
        EventBus.emit(
          isKeyUp
            ? GameCommands.GAMEPLAY.MOVEMENT.DASH_RELEASE
            : GameCommands.GAMEPLAY.MOVEMENT.DASH
        );
      }
      if (key.toLowerCase() === "r") {
        if (isKeyUp) {
          EventBus.emit(GameCommands.GAMEPLAY.MOVEMENT.RECOVER);
        } else {
          EventBus.emit(GameCommands.GAMEPLAY.MOVEMENT.ROLL);
        }
      }

      // Combat and transform controls (only on keydown)
      if (!isKeyUp) {
        if (key.toLowerCase() === "z")
          EventBus.emit(GameCommands.GAMEPLAY.COMBAT.ATTACK_1);
        if (key.toLowerCase() === "x")
          EventBus.emit(GameCommands.GAMEPLAY.COMBAT.ATTACK_2);
        if (key.toLowerCase() === "c")
          EventBus.emit(GameCommands.GAMEPLAY.COMBAT.ATTACK_3);
      }
      break;
  }
};
