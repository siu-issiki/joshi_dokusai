'use client';

import React from 'react';
import { FirebaseGame, FirebaseGamePlayer } from '@joshi-dokusai/shared';

interface TurnIndicatorProps {
  game: FirebaseGame;
  currentPlayer: FirebaseGamePlayer | null;
  isMyTurn: boolean;
  myRole: 'boss' | 'subordinate' | null;
}

/**
 * ターン表示コンポーネント
 * 現在のターン、プレイヤー、フェーズを表示
 */
export default function TurnIndicator({
  game,
  currentPlayer,
  isMyTurn,
  myRole,
}: TurnIndicatorProps) {
  // フェーズに応じたメッセージを取得
  const getPhaseMessage = () => {
    switch (game.phase) {
      case 'dictatorship':
        return {
          title: '独裁カード処理フェーズ',
          description: '独裁カードの効果が処理されています',
          color: 'bg-purple-100 border-purple-300 text-purple-800',
        };
      case 'subordinate_consultation':
      case 'subordinate_turn':
        return {
          title: '部下相談・アクションフェーズ',
          description: '部下が相談してアクションを実行します',
          color: 'bg-blue-100 border-blue-300 text-blue-800',
        };
      case 'boss_turn':
        return {
          title: '上司アクションフェーズ',
          description: '上司がアクションを実行します',
          color: 'bg-red-100 border-red-300 text-red-800',
        };
      case 'turn_end':
        return {
          title: '終了処理フェーズ',
          description: 'ターンの終了処理を行っています',
          color: 'bg-gray-100 border-gray-300 text-gray-800',
        };
      default:
        return {
          title: 'ゲーム進行中',
          description: '',
          color: 'bg-gray-100 border-gray-300 text-gray-800',
        };
    }
  };

  const phaseInfo = getPhaseMessage();

  // 自分のターンかどうかのメッセージ
  const getTurnMessage = () => {
    if (!currentPlayer) {
      return {
        message: 'ターン情報を読み込み中...',
        color: 'text-gray-600',
      };
    }

    if (isMyTurn) {
      return {
        message: 'あなたのターンです！',
        color: 'text-green-600 font-bold',
      };
    }

    return {
      message: `${currentPlayer.name}のターンです`,
      color: 'text-gray-700',
    };
  };

  const turnMessage = getTurnMessage();

  // ターン制限時間の表示（将来の実装用）
  const getRemainingTime = () => {
    // TODO: ターン制限時間の実装
    return null;
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${phaseInfo.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* フェーズ情報 */}
          <div className="mb-2">
            <h2 className="text-lg font-bold">{phaseInfo.title}</h2>
            {phaseInfo.description && (
              <p className="text-sm opacity-80">{phaseInfo.description}</p>
            )}
          </div>

          {/* ターン情報 */}
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-sm opacity-80">
                ターン {game.turnCount} / {game.maxTurns}
              </span>
            </div>

            {currentPlayer && (
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className={`text-sm ${turnMessage.color}`}>
                  {turnMessage.message}
                </span>
              </div>
            )}
          </div>

          {/* 特別な状況の表示 */}
          <div className="mt-2 space-y-1">
            {/* ノー残業デー */}
            {game.turnCount >= 3 && (
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">⚠️</span>
                <span className="text-sm font-semibold text-orange-600">
                  ノー残業デー発動中（攻撃カード無効化）
                </span>
              </div>
            )}

            {/* 最終ターン */}
            {game.turnCount >= game.maxTurns && (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">🚨</span>
                <span className="text-sm font-bold text-red-600 animate-pulse">
                  最終ターン！
                </span>
              </div>
            )}

            {/* 自分の役割に応じたヒント */}
            {isMyTurn && myRole && (
              <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                {myRole === 'boss' ? (
                  <span>
                    💡 上司として部下を攻撃するか、自分を回復しましょう
                  </span>
                ) : (
                  <span>
                    💡 部下として上司を攻撃するか、仲間を回復しましょう
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 制限時間表示（将来の実装用） */}
        {getRemainingTime() && (
          <div className="text-right">
            <div className="text-2xl font-bold">{getRemainingTime()}</div>
            <div className="text-sm opacity-80">残り時間</div>
          </div>
        )}
      </div>

      {/* ターン進行度バー */}
      <div className="mt-3">
        <div className="flex justify-between text-xs opacity-80 mb-1">
          <span>ターン進行度</span>
          <span>{Math.round((game.turnCount / game.maxTurns) * 100)}%</span>
        </div>
        <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (game.turnCount / game.maxTurns) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
