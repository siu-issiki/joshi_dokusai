'use client';

import React from 'react';
import { useGameState } from '@/hooks/useGameState';
import { usePlayerHand } from '@/hooks/usePlayerHand';
import { useGameActions } from '@/hooks/useGameActions';
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
    drawCard,
    passTurn,
    loading: actionLoading,
    error: actionError,
  } = useGameActions(gameId);
  const { user } = useAuth();

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

  if (!game || !hand || !user) {
    return <div className="text-gray-600 p-4">ゲーム情報が見つかりません</div>;
  }

  const currentPlayer = game.players[user.uid];
  const isMyTurn =
    game.players[Object.keys(game.players)[game.currentPlayerIndex]]?.id ===
    user.uid;

  return (
    <div className="min-h-screen bg-green-100 p-4">
      {/* ゲーム情報ヘッダー */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">上司独裁</h1>
            <p className="text-gray-600">
              ターン {game.turnCount} / フェーズ: {game.phase}
            </p>
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
          .filter((player) => player.id !== user.uid)
          .map((player) => (
            <div key={player.id} className="bg-white rounded-lg p-3 shadow-md">
              <h3 className="font-semibold text-gray-800">{player.name}</h3>
              <p className="text-sm text-gray-600">
                {player.role === 'boss' ? '上司' : '部下'}
              </p>
              <p className="text-red-600">ライフ: {player.life}</p>
              <p className="text-blue-600">手札: {player.handCount || 0}枚</p>
            </div>
          ))}
      </div>

      {/* メインゲームエリア */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ゲームフィールド */}
        <div className="flex-1 bg-white rounded-lg p-4 shadow-md">
          <h2 className="text-xl font-bold mb-4">ゲームフィールド</h2>

          {/* 独裁カード表示 */}
          {game.gameState?.dictatorshipEffects?.currentCard && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">独裁カード</h3>
              <p className="text-red-700">
                {game.gameState.dictatorshipEffects.currentCard.name}
              </p>
              <p className="text-sm text-red-600">
                対象: {game.gameState.dictatorshipEffects.currentCard.target}
              </p>
              {game.gameState.dictatorshipEffects.currentCard.isNullified && (
                <p className="text-xs text-gray-500">（無効化済み）</p>
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
            {isMyTurn ? (
              <p className="text-lg font-bold text-green-600">
                あなたのターンです
              </p>
            ) : (
              <p className="text-lg text-gray-600">
                {Object.values(game.players)[game.currentPlayerIndex]?.name}
                のターン
              </p>
            )}
          </div>
        </div>

        {/* プレイヤー手札 */}
        <div className="lg:w-80">
          <PlayerHand
            hand={hand}
            loading={handLoading}
            error={handError}
            onPlayCard={playCard}
            canPlayCards={isMyTurn}
            isMyTurn={isMyTurn}
          />
        </div>
      </div>

      {/* アクションボタン */}
      {isMyTurn && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2 bg-white rounded-lg p-2 shadow-lg">
            <button
              onClick={drawCard}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'ドロー中...' : 'カードドロー'}
            </button>
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

      {/* エラー表示 */}
      {actionError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg">
          {actionError}
        </div>
      )}
    </div>
  );
}
