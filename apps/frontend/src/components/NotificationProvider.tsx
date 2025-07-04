'use client';

import React, { createContext, useContext } from 'react';
import { useGameNotifications } from '@/hooks/useNotifications';
import NotificationContainer from './NotificationContainer';

// 通知コンテキストの型定義
type NotificationContextType = ReturnType<typeof useGameNotifications>;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

/**
 * 通知プロバイダーコンポーネント
 * アプリケーション全体に通知機能を提供
 */
export function NotificationProvider({ 
  children, 
  position = 'top-right' 
}: NotificationProviderProps) {
  const notificationMethods = useGameNotifications();

  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
      <NotificationContainer
        notifications={notificationMethods.notifications}
        onRemove={notificationMethods.removeNotification}
        position={position}
      />
    </NotificationContext.Provider>
  );
}

/**
 * 通知コンテキストを使用するためのフック
 */
export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

/**
 * ゲーム固有の通知を簡単に使用するためのヘルパーフック
 */
export function useGameNotificationHelpers() {
  const {
    notifyGameStart,
    notifyTurnStart,
    notifyCardPlayed,
    notifyDamage,
    notifyHeal,
    notifyPlayerDefeated,
    notifyGameEnd,
    notifySpecialEvent,
    notifyConnectionError,
    notifyConnectionRestored,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotificationContext();

  return {
    // ゲーム固有の通知
    game: {
      start: notifyGameStart,
      turnStart: notifyTurnStart,
      cardPlayed: notifyCardPlayed,
      damage: notifyDamage,
      heal: notifyHeal,
      playerDefeated: notifyPlayerDefeated,
      end: notifyGameEnd,
      specialEvent: notifySpecialEvent,
      connectionError: notifyConnectionError,
      connectionRestored: notifyConnectionRestored,
    },
    // 基本的な通知
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
}
