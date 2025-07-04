'use client';

import React from 'react';
import { FirebaseGame } from '@joshi-dokusai/shared';
import { useAuth } from '@/lib/auth';
import { useGameHelpers } from '@/hooks/useGameState';
import PlayerInfo from './PlayerInfo';
import GameStatus from './GameStatus';
import TurnIndicator from './TurnIndicator';

interface GameBoardProps {
  game: FirebaseGame;
  onPlayCard?: (cardId: string, targetPlayerId?: string) => void;
  onPassTurn?: () => void;
  loading?: boolean;
}

/**
 * メインゲームボードコンポーネント
 * ゲーム状態、プレイヤー情報、ターン表示を管理
 */
export default function GameBoard({
  game,
  onPassTurn,
  loading = false,
}: GameBoardProps) {
  const { user } = useAuth();
  const { currentPlayer, isMyTurn, myRole, isGameActive, myPlayer, players } =
    useGameHelpers(game, user?.uid || null);

  if (!user || !myPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ゲーム情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  // プレイヤーを役割別に分類
  const bossPlayer = players.find((p) => p.role === 'boss');
  const subordinatePlayers = players.filter((p) => p.role === 'subordinate');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ゲームヘッダー */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">上司独裁</h1>
                <p className="text-gray-600">ゲームID: {game.id}</p>
              </div>
              <GameStatus game={game} />
            </div>
          </div>
        </div>

        {/* ターン表示 */}
        <div className="mb-6">
          <TurnIndicator
            game={game}
            currentPlayer={currentPlayer}
            isMyTurn={isMyTurn}
            myRole={myRole}
          />
        </div>

        {/* メインゲームエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: 上司エリア */}
          <div className="lg:col-span-1">
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                上司
              </h2>
              {bossPlayer && (
                <PlayerInfo
                  player={bossPlayer}
                  isCurrentPlayer={currentPlayer?.id === bossPlayer.id}
                  isMe={myPlayer.id === bossPlayer.id}
                />
              )}
            </div>
          </div>

          {/* 中央: ゲーム情報エリア */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* デッキ情報 */}
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-2">デッキ情報</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {game.gameState.deckCount}
                    </div>
                    <div className="text-gray-600">残りカード</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {game.gameState.discardPile.length}
                    </div>
                    <div className="text-gray-600">捨て札</div>
                  </div>
                </div>
              </div>

              {/* ゲーム進行情報 */}
              <div className="bg-white rounded-lg p-4 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-2">ゲーム進行</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在のターン:</span>
                    <span className="font-semibold">
                      {game.turnCount} / {game.maxTurns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">フェーズ:</span>
                    <span className="font-semibold">
                      {game.phase === 'dictatorship'
                        ? '独裁カード'
                        : game.phase === 'subordinate_consultation' ||
                            game.phase === 'subordinate_turn'
                          ? '部下ターン'
                          : game.phase === 'boss_turn'
                            ? '上司ターン'
                            : game.phase === 'turn_end'
                              ? '終了処理'
                              : game.phase}
                    </span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              {isGameActive && (
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    アクション
                  </h3>
                  <div className="space-y-2">
                    {isMyTurn && (
                      <button
                        onClick={onPassTurn}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? '処理中...' : 'ターンパス'}
                      </button>
                    )}
                    {!isMyTurn && (
                      <div className="text-center text-gray-600 py-2">
                        他のプレイヤーのターンです
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側: 部下エリア */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                部下 ({subordinatePlayers.length}人)
              </h2>
              <div className="space-y-3">
                {subordinatePlayers.map((player) => (
                  <PlayerInfo
                    key={player.id}
                    player={player}
                    isCurrentPlayer={currentPlayer?.id === player.id}
                    isMe={myPlayer.id === player.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 自分の情報（下部固定） */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    myRole === 'boss'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {myRole === 'boss' ? '上司' : '部下'}
                </div>
                <div className="text-sm text-gray-600">
                  ライフ:{' '}
                  <span className="font-semibold text-red-600">
                    {myPlayer.life}
                  </span>{' '}
                  / {myPlayer.maxLife}
                </div>
                <div className="text-sm text-gray-600">
                  手札:{' '}
                  <span className="font-semibold">{myPlayer.handCount}</span>枚
                </div>
              </div>
              {isMyTurn && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-600">
                    あなたのターン
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
