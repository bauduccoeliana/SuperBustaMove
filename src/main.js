import { Boot } from "./scenes/Boot";
import { Game } from "./scenes/Game";
import { Game2 } from "./scenes/Game2";
import { GameOver } from "./scenes/GameOver";
import { InputManager } from "./scenes/InputManager";
import { IntroGb } from "./scenes/IntroGb";
import { IntroUbi } from "./scenes/IntroUbi";
import { IntroTait } from "./scenes/IntroTait";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { Selec1 } from "./scenes/Selec1";
import { Selec2 } from "./scenes/Selec2";
import { Selec3 } from "./scenes/Selec3";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [
    Boot,
    Game,
    Game2,
    GameOver,
    InputManager,
    IntroGb,
    IntroTait,
    IntroUbi,
    MainMenu,
    Preloader,
    Selec1,
    Selec2,
    Selec3,
  ],
};

export default new Phaser.Game(config);
