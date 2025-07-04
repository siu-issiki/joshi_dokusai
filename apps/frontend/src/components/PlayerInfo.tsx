'use client';

import React from 'react';
import { FirebaseGamePlayer } from '@joshi-dokusai/shared';

interface PlayerInfoProps {
  player: FirebaseGamePlayer;
  isCurrentPlayer: boolean;
  isMe: boolean;
  onTargetSelect?: (playerId: string) => void;
  selectable?: boolean;
}

/**
 * プレイヤー情報表示コンポーネント
 * ライフ、手札数、接続状態などを表示
 */
export default function PlayerInfo({
  player,
  isCurrentPlayer,
  isMe,
  onTargetSelect,
  selectable = false,
}: PlayerInfoProps) {
  const lifePercentage = (player.life / player.maxLife) * 100;

  // ライフバーの色を決定
  const getLifeBarColor = () => {
    if (lifePercentage > 60) return 'bg-green-500';
    if (lifePercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 接続状態のアイコン
  const getConnectionIcon = () => {
    if (!player.isConnected) {
      return (
        <div className="w-2 h-2 bg-gray-400 rounded-full" title="オフライン" />
      );
    }

    const timeSinceLastAction = Date.now() - player.lastAction;
    if (timeSinceLastAction > 30000) {
      // 30秒以上無操作
      return (
        <div className="w-2 h-2 bg-yellow-400 rounded-full" title="待機中" />
      );
    }

    return (
      <div className="w-2 h-2 bg-green-500 rounded-full" title="オンライン" />
    );
  };

  const handleClick = () => {
    if (selectable && onTargetSelect && !isMe) {
      onTargetSelect(player.id);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg p-3 border-2 transition-all duration-200
        ${isCurrentPlayer ? 'border-yellow-400 shadow-lg' : 'border-gray-200'}
        ${isMe ? 'ring-2 ring-blue-400' : ''}
        ${selectable && !isMe ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}
      `}
      onClick={handleClick}
    >
      {/* プレイヤー名と状態 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-800">
            {player.name}
            {isMe && (
              <span className="text-blue-600 text-sm ml-1">(あなた)</span>
            )}
          </span>
          {getConnectionIcon()}
        </div>

        {isCurrentPlayer && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-600 font-semibold">
              ターン中
            </span>
          </div>
        )}
      </div>

      {/* ライフ表示 */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">ライフ</span>
          <span className="text-sm font-semibold">
            <span
              className={
                lifePercentage <= 30 ? 'text-red-600' : 'text-gray-800'
              }
            >
              {player.life}
            </span>
            <span className="text-gray-500"> / {player.maxLife}</span>
          </span>
        </div>

        {/* ライフバー */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getLifeBarColor()}`}
            style={{ width: `${Math.max(0, lifePercentage)}%` }}
          />
        </div>
      </div>

      {/* 手札数 */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">手札</span>
        <div className="flex items-center space-x-1">
          <span className="font-semibold">{player.handCount}</span>
          <span className="text-gray-500">枚</span>
          {/* 手札アイコン */}
          <div className="flex space-x-0.5 ml-1">
            {Array.from({ length: Math.min(player.handCount, 5) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="w-2 h-3 bg-blue-400 rounded-sm"
                  style={{ transform: `translateX(${i * -2}px)` }}
                />
              )
            )}
            {player.handCount > 5 && (
              <span className="text-xs text-gray-500 ml-1">
                +{player.handCount - 5}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 役割バッジ */}
      <div className="mt-2">
        <span
          className={`
          inline-block px-2 py-1 rounded-full text-xs font-semibold
          ${
            player.role === 'boss'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }
        `}
        >
          {player.role === 'boss' ? '上司' : '部下'}
        </span>
      </div>

      {/* 選択可能な場合の表示 */}
      {selectable && !isMe && (
        <div className="mt-2 text-center">
          <span className="text-xs text-blue-600">クリックして選択</span>
        </div>
      )}

      {/* 最後のアクション時刻（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-1 text-xs text-gray-400">
          最終アクション: {new Date(player.lastAction).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
