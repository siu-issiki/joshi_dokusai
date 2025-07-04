'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
  autoSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setError('Firebase認証が初期化されていません');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('認証状態変更エラー:', error);
        setError('認証に失敗しました');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signIn = async (): Promise<User> => {
    try {
      setLoading(true);
      setError(null);

      if (!auth) {
        throw new Error('Firebase認証が初期化されていません');
      }

      const result = await signInAnonymously(auth);
      if (!result.user) {
        throw new Error('認証に失敗しました');
      }

      return result.user;
    } catch (error: unknown) {
      console.error('サインインエラー:', error);
      const errorMessage =
        error instanceof Error ? error.message : '認証に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!auth) {
        throw new Error('Firebase認証が初期化されていません');
      }

      await firebaseSignOut(auth);
    } catch (error: unknown) {
      console.error('サインアウトエラー:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'サインアウトに失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const autoSignIn = async (): Promise<void> => {
    if (!user && !loading) {
      try {
        await signIn();
      } catch (error) {
        console.error('自動サインインエラー:', error);
        // エラーは既にsignInで処理されているので、ここでは何もしない
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    autoSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 自動サインイン機能
export async function ensureAuthenticated(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase認証が初期化されていません');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const result = await signInAnonymously(auth);
    if (!result.user) {
      throw new Error('認証に失敗しました');
    }
    return result.user;
  } catch (error) {
    console.error('自動認証エラー:', error);
    throw error;
  }
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
