'use client';

import React, { useState } from 'react';
import { FirebasePlayerHand } from '@joshi-dokusai/shared';
import CardComponent from './CardComponent';
import HandStats from './HandStats';

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
  const [showStats, setShowStats] = useState(false);

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
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">エラー</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!hand || hand.cards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-center text-gray-500">
          <div className="text-lg font-semibold mb-2">手札なし</div>
          <div className="text-sm">カードがありません</div>
        </div>
      </div>
    );
  }

  const handleCardSelect = (cardId: string) => {
    if (!canPlayCards) return;

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  const handleCardPlay = (cardId: string, targetPlayerId?: string) => {
    if (!canPlayCards || !onPlayCard) return;

    onPlayCard(cardId, targetPlayerId);
    setSelectedCardId(null);
  };

  const selectedCard = selectedCardId
    ? hand.cards.find((card) => card.id === selectedCardId)
    : null;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              あなたの手札
            </h3>
            <p className="text-sm text-gray-600">
              {hand.cards.length}枚のカード
              {!isMyTurn && (
                <span className="text-orange-600 ml-2">
                  （他のプレイヤーのターン）
                </span>
              )}
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {showStats ? '統計を隠す' : '統計を表示'}
            </button>
          </div>
        </div>

        {/* 手札統計 */}
        {showStats && (
          <div className="mt-3 pt-3 border-t">
            <HandStats hand={hand} />
          </div>
        )}
      </div>

      {/* カード一覧 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {hand.cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              selected={selectedCardId === card.id}
              selectable={canPlayCards && isMyTurn}
              onSelect={() => handleCardSelect(card.id)}
              onPlay={(targetPlayerId?: string) =>
                handleCardPlay(card.id, targetPlayerId)
              }
              disabled={!canPlayCards || !isMyTurn}
            />
          ))}
        </div>

        {/* 手札が多い場合の表示調整 */}
        {hand.cards.length > 8 && (
          <div className="mt-3 text-center">
            {/* TODO: 手札が8枚以上の場合のページング機能を実装する */}
            <button className="text-sm text-blue-600 hover:text-blue-800">
              すべてのカードを表示
            </button>
          </div>
        )}
      </div>

      {/* 選択されたカードの詳細 */}
      {selectedCard && (
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <CardComponent
                card={selectedCard}
                selected={true}
                selectable={false}
                size="small"
              />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">
                選択中: {selectedCard.name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {selectedCard.description}
              </p>

              {canPlayCards && isMyTurn && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCardPlay(selectedCard.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    このカードを使用
                  </button>

                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    選択を解除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 操作ヒント */}
      {canPlayCards && isMyTurn && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 font-semibold">
              あなたのターンです - カードをクリックして選択し、使用してください
            </span>
          </div>
        </div>
      )}

      {!canPlayCards && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {!isMyTurn
                ? '他のプレイヤーのターンです'
                : 'カードを使用できません'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
