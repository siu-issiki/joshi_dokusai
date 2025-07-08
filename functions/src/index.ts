/**
 * Firebase Cloud Functions for 上司独裁 Game
 * エントリーポイント - 各サービスから関数をエクスポート
 */

// Firebase設定を初期化
import "./config/firebase";

// 各サービスから関数をインポートしてエクスポート
export {startGame} from "./game/gameService";
export {playCard, drawCard} from "./game/cardService";
export {
  processDictatorshipPhase,
  nullifyDictatorshipCard,
  endSubordinateConsultation,
} from "./game/dictatorshipService";
export {passTurn} from "./game/turnService";
