'use client';

import React, { useState } from 'react';
import { Card } from '@joshi-dokusai/shared';

interface CardComponentProps {
  card: Card;
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onSelect?: () => void;
  onPlay?: (targetPlayerId?: string) => void;
}

/**
 * カード表示コンポーネント
 * 個別のカードの表示、選択、使用機能を提供
 */
export default function CardComponent({
  card,
  selected = false,
  selectable = false,
  disabled = false,
  size = 'medium',
  onSelect,
  onPlay,
}: CardComponentProps) {
  const [showDetails, setShowDetails] = useState(false);

  // カードサイズに応じたクラス
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-20 h-28 text-xs';
      case 'large':
        return 'w-32 h-44 text-sm';
      default:
        return 'w-24 h-32 text-xs';
    }
  };

  // カテゴリに応じた色とアイコン
  const getCategoryDisplay = () => {
    switch (card.category) {
      case 'attack':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '⚔️',
          name: '攻撃',
        };
      case 'defense':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: '🛡️',
          name: '防御',
        };
      case 'recovery':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '💚',
          name: '回復',
        };
      case 'president':
        return {
          color: 'bg-purple-500',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: '👑',
          name: '社長',
        };
      case 'dictatorship':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '📋',
          name: '独裁',
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          name: '不明',
        };
    }
  };

  const categoryDisplay = getCategoryDisplay();

  const handleClick = () => {
    if (disabled) return;

    if (selectable && onSelect) {
      onSelect();
    }
  };

  const handleDoubleClick = () => {
    if (disabled || !onPlay) return;
    onPlay();
  };

  return (
    <div className="relative">
      <div
        className={`
          ${getSizeClasses()}
          ${categoryDisplay.bgColor}
          ${categoryDisplay.borderColor}
          border-2 rounded-lg p-2 cursor-pointer transition-all duration-200
          ${selected ? 'ring-2 ring-blue-400 shadow-lg transform scale-105' : ''}
          ${selectable && !disabled ? 'hover:shadow-md hover:transform hover:scale-102' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {/* カードヘッダー */}
        <div className="flex items-center justify-between mb-1">
          <div className={`w-3 h-3 rounded-full ${categoryDisplay.color}`} />
          <span className="text-xs font-bold">{card.type}</span>
        </div>

        {/* カード名 */}
        <div
          className={`font-semibold ${categoryDisplay.textColor} mb-1 leading-tight`}
        >
          {card.name}
        </div>

        {/* カテゴリアイコン */}
        <div className="text-center mb-1">
          <span className="text-lg">{categoryDisplay.icon}</span>
        </div>

        {/* カテゴリ表示 */}
        <div className="text-center">
          <div className="text-xs font-bold">{categoryDisplay.name}</div>
        </div>

        {/* 選択インジケーター */}
        {selected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      {/* 詳細ツールチップ */}
      {showDetails && size !== 'small' && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <div className="text-sm">
            <div className="font-semibold text-gray-800 mb-1">{card.name}</div>
            <div className={`text-xs ${categoryDisplay.textColor} mb-2`}>
              {categoryDisplay.icon} {categoryDisplay.name} • タイプ:{' '}
              {card.type}
            </div>
            <div className="text-gray-600 text-xs mb-2">{card.description}</div>

            {/* カード情報 */}
            <div className="border-t pt-2">
              <div className="text-xs text-gray-600">
                • カテゴリ: {categoryDisplay.name}
              </div>
              <div className="text-xs text-gray-600">
                • 公開カード: {card.isVisible ? 'はい' : 'いいえ'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作ヒント */}
      {selectable && !disabled && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
          {selected ? 'ダブルクリックで使用' : 'クリックで選択'}
        </div>
      )}
    </div>
  );
}
