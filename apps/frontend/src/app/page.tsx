'use client';

import RoomList from '@/components/RoomList';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading, autoSignIn } = useAuth();

  // 認証チェック
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">認証に失敗しました</p>
          <button
            onClick={autoSignIn}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">上司独裁</h1>
          <p className="text-gray-600">
            4-5人用非対称型対戦オンラインカードゲーム
          </p>
        </header>

        <main>
          <RoomList />
        </main>
      </div>
    </div>
  );
}
