import { useState, useEffect, useRef } from 'react';
import { FirebaseGame } from '@joshi-dokusai/shared';
import { useGameState } from './useGameState';

interface GameNotification {
  id: string;
  type:
    | 'turn-change'
    | 'life-gain'
    | 'life-loss'
    | 'card-played'
    | 'game-event';
  message: string;
  timestamp: number;
  playerId?: string;
}

/**
 * ゲーム通知システムフック
 * ゲームイベントのリアルタイム通知機能を実装
 */
export function useGameNotifications(gameId: string) {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const { game } = useGameState(gameId);
  const prevGameRef = useRef<FirebaseGame | null>(null);

  useEffect(() => {
    if (!game || !prevGameRef.current) {
      prevGameRef.current = game;
      return;
    }

    const prevGame = prevGameRef.current;

    // ターン変更通知
    if (game.currentPlayerIndex !== prevGame.currentPlayerIndex) {
      const currentPlayer = Object.values(game.players)[
        game.currentPlayerIndex
      ];
      if (currentPlayer) {
        addNotification({
          type: 'turn-change',
          message: `${currentPlayer.name}のターンです`,
          playerId: currentPlayer.id,
        });
      }
    }

    // フェーズ変更通知
    if (game.phase !== prevGame.phase) {
      const phaseNames = {
        dictatorship: '独裁フェーズ',
        subordinate_consultation: '部下相談フェーズ',
        subordinate_turn: '部下ターン',
        boss_turn: '上司ターン',
        turn_end: 'ターン終了',
      };

      addNotification({
        type: 'game-event',
        message: `${phaseNames[game.phase] || game.phase}に移行しました`,
      });
    }

    // ライフ変更通知
    Object.values(game.players).forEach((player) => {
      const prevPlayer = prevGame.players[player.id];
      if (prevPlayer && player.life !== prevPlayer.life) {
        const change = player.life - prevPlayer.life;
        addNotification({
          type: change > 0 ? 'life-gain' : 'life-loss',
          message: `${player.name}のライフが${Math.abs(change)}${change > 0 ? '回復' : 'ダメージ'}しました`,
          playerId: player.id,
        });
      }
    });

    // ターン数変更通知
    if (game.turnCount !== prevGame.turnCount) {
      addNotification({
        type: 'game-event',
        message: `ターン${game.turnCount}が開始されました`,
      });
    }

    prevGameRef.current = game;
  }, [game]);

  const addNotification = (
    notification: Omit<GameNotification, 'id' | 'timestamp'>
  ) => {
    const newNotification: GameNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // 最新10件保持

    // 5秒後に自動削除
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id)
      );
    }, 5000);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    clearNotifications,
  };
}
