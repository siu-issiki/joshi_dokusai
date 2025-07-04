'use client';

import React from 'react';
import { FirebaseGame } from '@joshi-dokusai/shared';

interface GameStatusProps {
  game: FirebaseGame;
}

/**
 * ゲーム状態表示コンポーネント
 * ゲームの進行状況、ステータスを表示
 */
export default function GameStatus({ game }: GameStatusProps) {
  // ステータスに応じた色とテキストを取得
  const getStatusDisplay = () => {
    switch (game.status) {
      case 'playing':
        return {
          color: 'bg-green-100 text-green-800',
          text: 'プレイ中',
          icon: '🎮',
        };
      case 'ended':
        return {
          color: 'bg-gray-100 text-gray-800',
          text: '終了',
          icon: '🏁',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: '不明',
          icon: '❓',
        };
    }
  };

  // フェーズに応じた表示を取得
  const getPhaseDisplay = () => {
    switch (game.phase) {
      case 'dictatorship':
        return {
          text: '独裁カード処理',
          description: '独裁カードの効果を処理中',
        };
      case 'subordinate_consultation':
      case 'subordinate_turn':
        return {
          text: '部下ターン',
          description: '部下がアクションを実行中',
        };
      case 'boss_turn':
        return {
          text: '上司ターン',
          description: '上司がアクションを実行中',
        };
      case 'turn_end':
        return {
          text: '終了処理',
          description: 'ターン終了処理を実行中',
        };
      default:
        return {
          text: game.phase,
          description: '',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const phaseDisplay = getPhaseDisplay();

  // ターン進行度を計算
  const turnProgress =
    game.maxTurns > 0 ? (game.turnCount / game.maxTurns) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* ゲームステータス */}
      <div className="flex items-center space-x-3">
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold ${statusDisplay.color}`}
        >
          <span className="mr-1">{statusDisplay.icon}</span>
          {statusDisplay.text}
        </div>

        {game.status === 'playing' && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{phaseDisplay.text}</span>
          </div>
        )}
      </div>

      {/* ターン進行度 */}
      {game.status === 'playing' && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">ターン進行</span>
            <span className="font-semibold">
              {game.turnCount} / {game.maxTurns}
            </span>
          </div>

          {/* 進行度バー */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, turnProgress)}%` }}
            />
          </div>

          {/* ノー残業デー警告 */}
          {game.turnCount >= 3 && (
            <div className="text-xs text-orange-600 font-semibold">
              ⚠️ ノー残業デー発動中
            </div>
          )}

          {/* 最終ターン警告 */}
          {game.turnCount >= game.maxTurns - 1 && (
            <div className="text-xs text-red-600 font-semibold animate-pulse">
              🚨 最終ターン！
            </div>
          )}
        </div>
      )}

      {/* フェーズ説明 */}
      {game.status === 'playing' && phaseDisplay.description && (
        <div className="text-xs text-gray-500">{phaseDisplay.description}</div>
      )}

      {/* ゲーム終了情報 */}
      {game.status === 'ended' && 'winner' in game && (
        <div className="space-y-1">
          <div className="text-sm font-semibold">
            勝者:{' '}
            <span
              className={
                game.winner === 'boss' ? 'text-red-600' : 'text-blue-600'
              }
            >
              {game.winner === 'boss' ? '上司' : '部下'}
            </span>
          </div>
          {'endReason' in game && (
            <div className="text-xs text-gray-600">
              理由: {String(game.endReason)}
            </div>
          )}
        </div>
      )}

      {/* 最終更新時刻 */}
      <div className="text-xs text-gray-400">
        最終更新: {new Date(game.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
