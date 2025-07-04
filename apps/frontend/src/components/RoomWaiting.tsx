'use client';

import React from 'react';
import { FirebaseRoom, FirebaseRoomPlayer, GAME_CONFIG } from '@joshi-dokusai/shared';

interface RoomWaitingProps {
  room: FirebaseRoom;
  myPlayer: FirebaseRoomPlayer | null;
  isRoomOwner: boolean;
  canStartGame: boolean;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  loading?: boolean;
}

/**
 * ルーム待機画面コンポーネント
 * プレイヤー一覧、準備状態、ゲーム開始機能を提供
 */
export default function RoomWaiting({
  room,
  myPlayer,
  isRoomOwner,
  canStartGame,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  loading = false,
}: RoomWaitingProps) {
  const players = Object.values(room.players);
  const readyCount = players.filter(player => player.isReady).length;

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '今参加';
    if (minutes < 60) return `${minutes}分前に参加`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前に参加`;
    
    const days = Math.floor(hours / 24);
    return `${days}日前に参加`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{room.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>ルームID: {room.id}</span>
                {room.isPrivate && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    🔒 プライベート
                  </span>
                )}
                <span>👥 {room.currentPlayers} / {room.maxPlayers}人</span>
              </div>
            </div>
            
            <button
              onClick={onLeaveRoom}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ルームを出る
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* プレイヤー一覧 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">プレイヤー一覧</h2>
                <div className="text-sm text-gray-600">
                  準備完了: {readyCount} / {room.currentPlayers}人
                </div>
              </div>

              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      player.isReady 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* 準備状態インジケーター */}
                      <div className={`w-3 h-3 rounded-full ${
                        player.isReady ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      
                      {/* プレイヤー名 */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">
                            {player.name}
                          </span>
                          {player.id === room.createdBy && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              👑 ルーム主
                            </span>
                          )}
                          {player.id === myPlayer?.id && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              あなた
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(player.joinedAt)}
                        </div>
                      </div>
                    </div>

                    {/* 準備状態 */}
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      player.isReady 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {player.isReady ? '準備完了' : '待機中'}
                    </div>
                  </div>
                ))}

                {/* 空きスロット */}
                {Array.from({ length: room.maxPlayers - room.currentPlayers }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                  >
                    <span className="text-gray-500 text-sm">プレイヤーを待機中...</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 準備ボタン */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ゲーム準備</h3>
              
              {myPlayer && (
                <button
                  onClick={onToggleReady}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    myPlayer.isReady
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? '処理中...' : myPlayer.isReady ? '準備を取り消す' : '準備完了'}
                </button>
              )}

              {/* ゲーム開始ボタン（ルーム主のみ） */}
              {isRoomOwner && (
                <div className="mt-4">
                  <button
                    onClick={onStartGame}
                    disabled={!canStartGame || loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'ゲーム開始中...' : 'ゲーム開始'}
                  </button>
                  
                  {!canStartGame && (
                    <div className="mt-2 text-xs text-gray-600">
                      {room.currentPlayers < GAME_CONFIG.MIN_PLAYERS 
                        ? `最低${GAME_CONFIG.MIN_PLAYERS}人必要です`
                        : '全プレイヤーの準備完了が必要です'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ゲーム情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ゲーム情報</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ゲーム:</span>
                  <span className="font-semibold">上司独裁</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">プレイヤー数:</span>
                  <span className="font-semibold">{room.currentPlayers} / {room.maxPlayers}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最大ターン数:</span>
                  <span className="font-semibold">{GAME_CONFIG.MAX_TURNS}ターン</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">上司ライフ:</span>
                  <span className="font-semibold">{GAME_CONFIG.BOSS_INITIAL_LIFE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">部下ライフ:</span>
                  <span className="font-semibold">{GAME_CONFIG.SUBORDINATE_INITIAL_LIFE}</span>
                </div>
              </div>
            </div>

            {/* ルール説明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">ゲームルール</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 1人が上司、残りが部下に分かれます</li>
                <li>• 上司は部下全員を倒すことが目標</li>
                <li>• 部下は協力して上司を倒すことが目標</li>
                <li>• 3ターン目からノー残業デー発動</li>
                <li>• 最大{GAME_CONFIG.MAX_TURNS}ターンで勝負が決まります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
