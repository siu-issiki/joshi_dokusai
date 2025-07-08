'use client';

import { signInAnonymously, onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth } from './firebase';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
  autoSignIn: () => Promise<void>;
  isAuthenticated: boolean;
}

// 認証コンテキスト
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 匿名認証でサインイン
export async function signInAnonymous(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase認証が初期化されていません');
  }

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
  if (!auth) {
    throw new Error('Firebase認証が初期化されていません');
  }

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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthProviderコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedAutoSignIn, setHasTriedAutoSignIn] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setError(null);

        if (user) {
          console.log('認証状態変更: ログイン済み', user.uid);
          setLoading(false);
        } else {
          console.log('認証状態変更: 未ログイン');
          // ユーザーが存在せず、まだ自動サインインを試していない場合に実行
          if (!hasTriedAutoSignIn) {
            setHasTriedAutoSignIn(true);
            // 自動サインインを実行（loadingはtrueのまま維持）
            autoSignIn();
          } else {
            // 自動サインインを既に試行済みの場合のみloadingをfalseに
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error('認証状態監視エラー:', error);
        setError('認証状態の監視でエラーが発生しました');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [hasTriedAutoSignIn]);

  // 自動ログイン関数
  const autoSignIn = async () => {
    try {
      // loadingは既にtrueなので、setLoading(true)は不要
      await signInAnonymous();
      // 成功時はonAuthStateChangedでloadingがfalseになる
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      setError(message);
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    signIn: signInAnonymous,
    signOut,
    autoSignIn,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
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
export function withAuth<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, autoSignIn } = useAuth();

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
            <button onClick={autoSignIn} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              再試行
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
