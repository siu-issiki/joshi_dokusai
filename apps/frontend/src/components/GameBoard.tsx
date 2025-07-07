'use client';

import React from 'react';
import { useGameState } from '@/hooks/useGameState';
import { usePlayerHand } from '@/hooks/usePlayerHand';
import { useGameActions } from '@/hooks/useGameActions';
import { useAutoCardDraw } from '@/hooks/useAutoCardDraw';
import { useAuth } from '@/lib/auth';
import PlayerHand from './PlayerHand';

interface GameBoardProps {
  gameId: string;
}

/**
 * ゲームボードコンポーネント
 * ゲーム全体のUIレイアウトとゲーム状態表示を実装
 */
export default function GameBoard({ gameId }: GameBoardProps) {
  const { game, loading: gameLoading, error: gameError } = useGameState(gameId);
  const {
    hand,
    loading: handLoading,
    error: handError,
  } = usePlayerHand(gameId);
  const {
    playCard,
    passTurn,
    processDictatorshipPhase,
    nullifyDictatorshipCard,
    endSubordinateConsultation,
    loading: actionLoading,
    error: actionError,
  } = useGameActions(gameId);
  const { user } = useAuth();

  // 自動カードドロー
  useAutoCardDraw(game, gameId);

  if (gameLoading || handLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (gameError || handError) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        エラー: {gameError || handError}
      </div>
    );
  }

  if (!game || !user) {
    return <div className="text-gray-600 p-4">ゲーム情報が見つかりません</div>;
  }

  // プレイヤーデータを取得（player.idがuser.uidと一致するものを探す）
  const currentPlayer = Object.values(game.players).find(
    (player) => (player as { id: string }).id === user.uid
  );

  const isMyTurn =
    Object.values(game.players)[game.currentPlayerIndex]?.id === user.uid;

  return (
    <div className="min-h-screen bg-green-100 p-4">
      {/* ゲーム終了時のオーバーレイ */}
      {game.status === 'ended' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {game.winner === 'boss' ? '上司の勝利！' : '部下の勝利！'}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {game.endReason || 'ゲームが終了しました'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                新しいゲームを開始
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ルーム一覧に戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ゲーム情報ヘッダー */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">上司独裁</h1>
            <p className="text-gray-600">
              ターン {game.turnCount} / フェーズ: {game.phase}
            </p>
            {game.status === 'ended' && (
              <p className="text-red-600 font-semibold">ゲーム終了</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {currentPlayer?.name} (
              {currentPlayer?.role === 'boss' ? '上司' : '部下'})
            </p>
            <p className="text-red-600">ライフ: {currentPlayer?.life}</p>
          </div>
        </div>
      </div>

      {/* 他プレイヤー情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.values(game.players)
          .filter((player) => (player as { id: string }).id !== user.uid)
          .map((player) => {
            const typedPlayer = player as {
              id: string;
              name: string;
              role: string;
              life: number;
              handCount?: number;
            };
            return (
              <div
                key={typedPlayer.id}
                className="bg-white rounded-lg p-3 shadow-md"
              >
                <h3 className="font-semibold text-gray-800">
                  {typedPlayer.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {typedPlayer.role === 'boss' ? '上司' : '部下'}
                </p>
                <p className="text-red-600">ライフ: {typedPlayer.life}</p>
                <p className="text-blue-600">
                  手札: {typedPlayer.handCount || 0}枚
                </p>
              </div>
            );
          })}
      </div>

      {/* メインゲームエリア */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ゲームフィールド */}
        <div className="flex-1 bg-white rounded-lg p-4 shadow-md">
          <h2 className="text-xl font-bold mb-4">ゲームフィールド</h2>

          {/* 独裁フェーズ処理ボタン（上司のみ） */}
          {game.phase === 'dictatorship' &&
            !game.gameState?.dictatorshipEffects?.currentCard &&
            game.status === 'playing' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  独裁フェーズ
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  {currentPlayer?.role === 'boss'
                    ? '独裁カードの山札から1枚引いて場に配置します'
                    : '上司が独裁カードを引くのを待っています...'}
                </p>
                {currentPlayer?.role === 'boss' ? (
                  <button
                    onClick={async () => {
                      try {
                        await processDictatorshipPhase();
                      } catch (error) {
                        console.error('独裁フェーズ処理エラー:', error);
                      }
                    }}
                    disabled={actionLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? '処理中...' : '独裁カードを引く'}
                  </button>
                ) : (
                  <div className="text-gray-500 text-sm">
                    上司の操作をお待ちください
                  </div>
                )}
              </div>
            )}

          {/* 独裁カード表示 */}
          {game.gameState?.dictatorshipEffects?.currentCard && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">独裁カード</h3>
                  <p className="text-red-700">
                    {game.gameState.dictatorshipEffects.currentCard.name}
                  </p>
                  <p className="text-sm text-red-600">
                    対象:{' '}
                    {game.gameState.dictatorshipEffects.currentCard.target}
                  </p>
                  {game.gameState.dictatorshipEffects.currentCard
                    .isNullified && (
                    <p className="text-xs text-gray-500">（無効化済み）</p>
                  )}
                </div>

                {/* 無効化ボタン（部下のみ） */}
                {currentPlayer?.role === 'subordinate' &&
                  !game.gameState.dictatorshipEffects.currentCard.isNullified &&
                  (game.phase === 'subordinate_consultation' ||
                    game.status === 'playing') && (
                    <button
                      onClick={async () => {
                        try {
                          await nullifyDictatorshipCard();
                        } catch (error) {
                          console.error('独裁カード無効化エラー:', error);
                        }
                      }}
                      disabled={actionLoading}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? '処理中...' : '無効化'}
                    </button>
                  )}
              </div>
            </div>
          )}

          {/* 部下相談フェーズの処理 */}
          {game.phase === 'subordinate_consultation' &&
            game.status === 'playing' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  部下相談フェーズ
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  {currentPlayer?.role === 'subordinate'
                    ? '独裁カードを無効化するか相談して決定してください。決定後は「相談終了」ボタンを押してください。'
                    : '部下が独裁カードについて相談中です...'}
                </p>
                {currentPlayer?.role === 'subordinate' && (
                  <button
                    onClick={async () => {
                      try {
                        await endSubordinateConsultation();
                      } catch (error) {
                        console.error('部下相談終了エラー:', error);
                      }
                    }}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? '処理中...' : '相談終了'}
                  </button>
                )}
              </div>
            )}

          {/* 社長カード表示 */}
          {game.gameState?.presidentCard && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">社長カード</h3>
              <p className="text-yellow-700">
                {game.gameState.presidentCard.card.name}
              </p>
              <p className="text-sm text-yellow-600">
                {game.gameState.presidentCard.card.description}
              </p>
              <p className="text-xs text-yellow-500">
                残り{game.gameState.presidentCard.turnsRemaining}ターン
              </p>
            </div>
          )}

          {/* ターン表示 */}
          <div className="text-center p-4">
            {game.phase === 'dictatorship' ? (
              <p className="text-lg font-bold text-red-600">
                独裁フェーズ - 上司の独裁カード処理中
              </p>
            ) : game.phase === 'subordinate_consultation' ? (
              <p className="text-lg font-bold text-orange-600">
                部下相談フェーズ - 独裁カードの無効化を決定中
              </p>
            ) : isMyTurn ? (
              <p className="text-lg font-bold text-green-600">
                あなたのターンです
              </p>
            ) : (
              <p className="text-lg text-gray-600">
                {
                  (
                    Object.values(game.players)[game.currentPlayerIndex] as {
                      name: string;
                    }
                  )?.name
                }
                のターン
              </p>
            )}
          </div>

          {/* ゲームログ（最新3件） */}
          {game.turnHistory && game.turnHistory.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">最近のアクション</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.values(game.turnHistory)
                  .slice(-3)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <span className="font-medium">
                        {entry.action?.type === 'play-card' &&
                          '🃏 カードプレイ'}
                        {entry.action?.type === 'pass-turn' && '⏭️ ターンパス'}
                        {entry.action?.type === 'draw-dictatorship' &&
                          '👑 独裁カード引く'}
                        {entry.action?.type === 'nullify-dictatorship' &&
                          '❌ 独裁カード無効化'}
                      </span>
                      {entry.action.effectMessage && (
                        <p className="text-xs text-blue-600 mt-1">
                          {entry.action.effectMessage}
                        </p>
                      )}
                      {entry.action.cardName && (
                        <p className="text-xs text-purple-600">
                          カード: {entry.action.cardName}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* プレイヤー手札 */}
        <div className="lg:w-80">
          <PlayerHand
            hand={hand}
            loading={handLoading}
            error={handError}
            onPlayCard={playCard}
            onPassTurn={passTurn}
            canPlayCards={isMyTurn && game.phase !== 'dictatorship'}
            isMyTurn={isMyTurn}
            players={Object.values(game.players).map((player) => ({
              id: (player as any).id,
              name: (player as any).name,
              role: (player as any).role,
              life: (player as any).life,
            }))}
            currentPlayerId={user?.uid}
          />
        </div>
      </div>

      {/* アクションボタン */}
      {isMyTurn &&
        game.phase !== 'dictatorship' &&
        game.phase !== 'subordinate_consultation' && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-2 bg-white rounded-lg p-2 shadow-lg">
              <button
                onClick={passTurn}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {actionLoading ? 'パス中...' : 'ターンパス'}
              </button>
            </div>
          </div>
        )}

      {/* 独裁フェーズ中の状態表示 */}
      {(game.phase === 'dictatorship' ||
        game.phase === 'subordinate_consultation') &&
        currentPlayer?.role !== 'boss' && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">
                {game.phase === 'dictatorship'
                  ? '独裁フェーズ中 - 上司の操作をお待ちください'
                  : '部下相談フェーズ - 独裁カードの無効化を決定してください'}
              </p>
            </div>
          </div>
        )}

      {/* エラー表示 */}
      {actionError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg">
          {actionError}
        </div>
      )}
    </div>
  );
}
