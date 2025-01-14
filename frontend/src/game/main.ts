import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Corruption as Platformer } from "./scenes/CORRUPTION";
import { MainMenu } from "./scenes/MainMenu";
import { Tutorial } from "./scenes/Tutorial";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "transparent",
  scene: [Boot, Preloader, MainMenu, Platformer, GameOver, Tutorial],
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 1000,
        x: 0,
      },
      debug: false,
    },
  },
  audio: {
    disableWebAudio: false,
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
