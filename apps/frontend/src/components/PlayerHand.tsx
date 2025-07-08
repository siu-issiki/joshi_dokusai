"use client";

import React, { useState } from "react";
import { FirebasePlayerHand } from "@joshi-dokusai/shared";

interface PlayerHandProps {
  hand: FirebasePlayerHand | null;
  loading: boolean;
  error: string | null;
  onPlayCard?: (cardId: string, targetPlayerId?: string) => Promise<unknown>;
  onPassTurn?: () => Promise<unknown>;
  canPlayCards?: boolean;
  isMyTurn?: boolean;
  players?: Array<{
    id: string;
    name: string;
    role: string;
    life: number;
  }>;
  currentPlayerId?: string;
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
  onPassTurn,
  canPlayCards = false,
  isMyTurn = false,
  players = [],
  currentPlayerId,
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
      setTargetPlayer(null);
    } else {
      setSelectedCardId(cardId);
      setTargetPlayer(null);
    }
  };

  const handlePlayCard = async () => {
    if (!selectedCardId || !onPlayCard) return;

    const selectedCard = hand?.cards.find((card) => card.id === selectedCardId);
    let finalTargetPlayer = targetPlayer;

    // 攻撃カードの場合、自動的にターゲットを決定
    if (selectedCard?.category === "attack") {
      const targetablePlayers = getTargetablePlayers();
      if (targetablePlayers.length === 1) {
        // ターゲットが一人の場合は自動選択
        finalTargetPlayer = targetablePlayers[0].id;
      } else if (targetablePlayers.length > 1 && !targetPlayer) {
        // 複数のターゲットがいる場合は選択が必要
        alert("攻撃対象を選択してください");
        return;
      }
    }

    // 回復カードの場合、ターゲットが選択されていない場合はエラー
    if (selectedCard?.category === "recovery" && !finalTargetPlayer) {
      alert("回復対象を選択してください");
      return;
    }

    try {
      await onPlayCard(selectedCardId, finalTargetPlayer || undefined);
      setSelectedCardId(null);
      setTargetPlayer(null);

      // カード使用が成功したらターンを終了
      if (onPassTurn) {
        await onPassTurn();
      }
    } catch (error) {
      console.error("カードプレイエラー:", error);
    }
  };

  // 選択されたカードの情報を取得
  const selectedCard = selectedCardId
    ? hand?.cards.find((card) => card.id === selectedCardId)
    : null;

  // ターゲット選択可能なプレイヤーを取得
  const getTargetablePlayers = () => {
    if (!selectedCard || !currentPlayerId) return [];

    return players.filter((player) => {
      // 自分以外のプレイヤー
      if (player.id === currentPlayerId) return false;

      // 攻撃カードの場合は敵対陣営のみ
      if (selectedCard.category === "attack") {
        const currentPlayer = players.find((p) => p.id === currentPlayerId);
        return currentPlayer && player.role !== currentPlayer.role;
      }

      // 回復カードの場合は同じ陣営のみ（自分含む）
      if (selectedCard.category === "recovery") {
        const currentPlayer = players.find((p) => p.id === currentPlayerId);
        return currentPlayer && player.role === currentPlayer.role;
      }

      return false;
    });
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
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }
              ${!isMyTurn || !canPlayCards ? "opacity-50 cursor-not-allowed" : ""}
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
          {/* ターゲット選択UI（回復カードまたは複数ターゲットがある攻撃カードの場合） */}
          {selectedCard && (
            <>
              {/* 攻撃カードで複数ターゲットがある場合のみ選択UI表示 */}
              {selectedCard.category === "attack" &&
                getTargetablePlayers().length > 1 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">
                      攻撃対象を選択:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {getTargetablePlayers().map((player) => (
                        <button
                          key={player.id}
                          onClick={() => setTargetPlayer(player.id)}
                          className={`p-2 text-left border rounded ${
                            targetPlayer === player.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {player.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {player.role === "boss" ? "上司" : "部下"} - ライフ:{" "}
                            {player.life}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 攻撃カードで単一ターゲットの場合は自動選択の表示 */}
              {selectedCard.category === "attack" &&
                getTargetablePlayers().length === 1 && (
                  <div className="mb-4 p-2 bg-gray-50 rounded border">
                    <h4 className="text-sm font-semibold mb-1">攻撃対象:</h4>
                    <div className="text-sm text-gray-700">
                      {getTargetablePlayers()[0].name} (
                      {getTargetablePlayers()[0].role === "boss"
                        ? "上司"
                        : "部下"}
                      )
                    </div>
                  </div>
                )}

              {/* 回復カードの場合は常に選択UI表示 */}
              {selectedCard.category === "recovery" && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">
                    回復対象を選択:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {/* 自分も選択可能 */}
                    <button
                      onClick={() => setTargetPlayer(currentPlayerId || "")}
                      className={`p-2 text-left border rounded ${
                        targetPlayer === currentPlayerId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-medium">自分</div>
                    </button>
                    {getTargetablePlayers().map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setTargetPlayer(player.id)}
                        className={`p-2 text-left border rounded ${
                          targetPlayer === player.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-sm font-medium">{player.name}</div>
                        <div className="text-xs text-gray-600">
                          {player.role === "boss" ? "上司" : "部下"} - ライフ:{" "}
                          {player.life}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={handlePlayCard}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "使用中..." : "カードを使用"}
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
