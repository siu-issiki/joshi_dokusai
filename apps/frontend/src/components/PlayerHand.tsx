'use client';

import React, { useState } from 'react';
import { FirebasePlayerHand } from '@joshi-dokusai/shared';

interface PlayerHandProps {
  hand: FirebasePlayerHand | null;
  loading: boolean;
  error: string | null;
  onPlayCard?: (cardId: string, targetPlayerId?: string) => void;
  canPlayCards?: boolean;
  isMyTurn?: boolean;
}

/**
 * プレイヤー手札表示コンポーネント
 * 手札のカード表示、選択、使用機能を提供
 */
export default function PlayerHand({
  hand,
  loading,
  error,
  onPlayCard,
  canPlayCards = false,
  isMyTurn = false,
}: PlayerHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [targetPlayer, setTargetPlayer] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">手札を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-red-600 text-center">エラー: {error}</div>
      </div>
    );
  }

  if (!hand || !hand.cards) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-gray-600 text-center">手札がありません</div>
      </div>
    );
  }

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || loading || !canPlayCards) return;

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  const handlePlayCard = async () => {
    if (!selectedCardId || !onPlayCard) return;

    try {
      await onPlayCard(selectedCardId, targetPlayer || undefined);
      setSelectedCardId(null);
      setTargetPlayer(null);
    } catch (error) {
      console.error('カードプレイエラー:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold mb-4">手札 ({hand.cards.length}枚)</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {hand.cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`
              p-3 border rounded-lg cursor-pointer transition-all
              ${
                selectedCardId === card.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }
              ${!isMyTurn || !canPlayCards ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="text-sm font-semibold text-gray-800">
              {card.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">{card.description}</div>
            <div className="text-xs text-blue-600 mt-1">
              {card.type} - {card.category}
            </div>
          </div>
        ))}
      </div>

      {selectedCardId && canPlayCards && isMyTurn && (
        <div className="border-t pt-4">
          <button
            onClick={handlePlayCard}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '使用中...' : 'カードを使用'}
          </button>
        </div>
      )}

      {!isMyTurn && (
        <div className="text-center text-gray-500 text-sm">
          あなたのターンではありません
        </div>
      )}
    </div>
  );
}
