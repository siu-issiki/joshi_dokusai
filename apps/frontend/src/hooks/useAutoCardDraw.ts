import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useGameActions } from './useGameActions';
import { FirebaseGame } from '@joshi-dokusai/shared';

/**
 * 自動カードドローフック
 * プレイヤーのターン開始時に自動でカードをドローする
 */
export function useAutoCardDraw(game: FirebaseGame | null, gameId: string) {
  const { user } = useAuth();
  const { drawCard } = useGameActions(gameId);
  const prevGameRef = useRef<FirebaseGame | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!game || !user || !prevGameRef.current) {
      prevGameRef.current = game;
      return;
    }

    const prevGame = prevGameRef.current;

    // ターンが変わったかチェック
    const turnChanged = game.currentPlayerIndex !== prevGame.currentPlayerIndex;

    // 現在のプレイヤーが自分かチェック
    const currentPlayer = Object.values(game.players)[game.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === user.uid;

    // プレイヤーターン（部下ターンまたは上司ターン）かチェック
    const isPlayerTurn =
      game.phase === 'subordinate_turn' || game.phase === 'boss_turn';

    // ゲームが進行中かチェック
    const isGameActive = game.status === 'playing';

    // 自動ドロー実行条件
    if (
      turnChanged &&
      isMyTurn &&
      isPlayerTurn &&
      isGameActive &&
      !isDrawingRef.current
    ) {
      isDrawingRef.current = true;

      // 少し遅延を入れてからドロー（UI更新後に実行）
      setTimeout(async () => {
        try {
          await drawCard();
          console.log('Auto card draw successful for player:', user.uid);
        } catch (error) {
          console.error('Auto card draw failed:', error);
          // エラーが発生してもゲームは続行
        } finally {
          isDrawingRef.current = false;
        }
      }, 500);
    }

    prevGameRef.current = game;
  }, [game, user, drawCard]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      isDrawingRef.current = false;
    };
  }, []);
}
