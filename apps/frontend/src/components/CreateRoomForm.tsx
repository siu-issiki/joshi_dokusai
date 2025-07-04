'use client';

import React, { useState } from 'react';
import { GAME_CONFIG } from '@joshi-dokusai/shared';

interface CreateRoomFormProps {
  onCreateRoom: (
    name: string,
    maxPlayers: number,
    isPrivate: boolean,
    password?: string
  ) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * ルーム作成フォームコンポーネント
 * ルーム名、プレイヤー数、プライベート設定などを入力
 */
export default function CreateRoomForm({
  onCreateRoom,
  onCancel,
  loading = false,
}: CreateRoomFormProps) {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(GAME_CONFIG.MAX_PLAYERS);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!roomName.trim()) {
      newErrors.roomName = 'ルーム名を入力してください';
    } else if (roomName.length > 50) {
      newErrors.roomName = 'ルーム名は50文字以内で入力してください';
    }

    if (maxPlayers < GAME_CONFIG.MIN_PLAYERS) {
      newErrors.maxPlayers = `最低${GAME_CONFIG.MIN_PLAYERS}人必要です`;
    } else if (maxPlayers > GAME_CONFIG.MAX_PLAYERS) {
      newErrors.maxPlayers = `最大${GAME_CONFIG.MAX_PLAYERS}人までです`;
    }

    if (isPrivate && !password.trim()) {
      newErrors.password = 'プライベートルームにはパスワードが必要です';
    } else if (password.length > 20) {
      newErrors.password = 'パスワードは20文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onCreateRoom(
      roomName.trim(),
      maxPlayers,
      isPrivate,
      isPrivate ? password.trim() : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          新しいルームを作成
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ルーム名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ルーム名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例: 楽しい上司独裁ゲーム"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.roomName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.roomName && (
              <p className="text-red-500 text-xs mt-1">{errors.roomName}</p>
            )}
          </div>

          {/* 最大プレイヤー数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大プレイヤー数
            </label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxPlayers ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {Array.from(
                {
                  length: GAME_CONFIG.MAX_PLAYERS - GAME_CONFIG.MIN_PLAYERS + 1,
                },
                (_, i) => GAME_CONFIG.MIN_PLAYERS + i
              ).map((num) => (
                <option key={num} value={num}>
                  {num}人
                </option>
              ))}
            </select>
            {errors.maxPlayers && (
              <p className="text-red-500 text-xs mt-1">{errors.maxPlayers}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              上司独裁は{GAME_CONFIG.MIN_PLAYERS}〜{GAME_CONFIG.MAX_PLAYERS}
              人で遊べます
            </p>
          </div>

          {/* プライベート設定 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">プライベートルーム</span>
            </label>
            <p className="text-gray-500 text-xs mt-1">
              パスワードが必要なルームにします
            </p>
          </div>

          {/* パスワード */}
          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {/* ゲーム説明 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              上司独裁について
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • {GAME_CONFIG.MIN_PLAYERS}〜{GAME_CONFIG.MAX_PLAYERS}
                人用の非対称対戦カードゲーム
              </li>
              <li>• 1人が上司、残りが部下に分かれて戦います</li>
              <li>
                • 上司：ライフ{GAME_CONFIG.BOSS_INITIAL_LIFE}、手札
                {GAME_CONFIG.BOSS_INITIAL_HAND_SIZE}枚
              </li>
              <li>
                • 部下：ライフ{GAME_CONFIG.SUBORDINATE_INITIAL_LIFE}、手札
                {GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE}枚
              </li>
              <li>• 最大{GAME_CONFIG.MAX_TURNS}ターンで勝負が決まります</li>
            </ul>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? '作成中...' : 'ルーム作成'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
