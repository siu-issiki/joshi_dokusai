'use client';

import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';

// 匿名認証でサインイン
export async function signInAnonymous(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    console.log('匿名認証成功:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('認証エラー:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    throw new Error(`認証に失敗しました: ${message}`);
  }
}

// サインアウト
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('サインアウト成功');
  } catch (error) {
    console.error('サインアウトエラー:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    throw new Error(`サインアウトに失敗しました: ${message}`);
  }
}

// 認証状態を管理するカスタムフック
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);

        if (user) {
          console.log('認証状態変更: ログイン済み', user.uid);
        } else {
          console.log('認証状態変更: 未ログイン');
        }
      },
      (error) => {
        console.error('認証状態監視エラー:', error);
        setError('認証状態の監視でエラーが発生しました');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // 自動ログイン関数
  const autoSignIn = async () => {
    if (!user && !loading) {
      try {
        setLoading(true);
        await signInAnonymous();
      } catch (error) {
        const message = error instanceof Error ? error.message : '不明なエラー';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    user,
    loading,
    error,
    signIn: signInAnonymous,
    signOut,
    autoSignIn,
    isAuthenticated: !!user,
  };
}

// プレイヤー名を管理するカスタムフック
export function usePlayerName() {
  const [playerName, setPlayerName] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    // ローカルストレージからプレイヤー名を復元
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    } else if (user) {
      // デフォルト名を設定
      const defaultName = `プレイヤー${user.uid.slice(-4)}`;
      setPlayerName(defaultName);
      localStorage.setItem('playerName', defaultName);
    }
  }, [user]);

  const updatePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('playerName', name);
  };

  return {
    playerName,
    updatePlayerName,
  };
}

// 認証が必要なコンポーネントをラップするHOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, autoSignIn } = useAuth();

    useEffect(() => {
      if (!loading && !user) {
        autoSignIn();
      }
    }, [loading, user, autoSignIn]);

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

    return <Component {...props} />;
  };
}
