'use client';

import React from 'react';
import { Notification } from '@/hooks/useNotifications';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
}

/**
 * 通知表示コンテナコンポーネント
 * 複数の通知をスタック形式で表示
 */
export default function NotificationContainer({
  notifications,
  onRemove,
  position = 'top-right',
}: NotificationContainerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 ${getPositionClasses()} space-y-2 max-w-sm w-full`}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

/**
 * 個別通知アイテムコンポーネント
 */
function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: '✅',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          closeColor: 'text-green-400 hover:text-green-600',
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: '❌',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          closeColor: 'text-red-400 hover:text-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          closeColor: 'text-yellow-400 hover:text-yellow-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'ℹ️',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          closeColor: 'text-blue-400 hover:text-blue-600',
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: '📢',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700',
          closeColor: 'text-gray-400 hover:text-gray-600',
        };
    }
  };

  const styles = getTypeStyles();

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return '今';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分前`;

    const hours = Math.floor(minutes / 60);
    return `${hours}時間前`;
  };

  return (
    <div
      className={`
      ${styles.bg} border rounded-lg shadow-lg p-4 
      transform transition-all duration-300 ease-in-out
      hover:shadow-xl animate-slide-in-right
    `}
    >
      <div className="flex items-start space-x-3">
        {/* アイコン */}
        <div className={`flex-shrink-0 ${styles.iconColor}`}>
          <span className="text-lg">{styles.icon}</span>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-semibold ${styles.titleColor}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.timestamp)}
            </span>
          </div>

          <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
            {notification.message}
          </p>

          {/* 永続通知の場合の表示 */}
          {notification.persistent && (
            <div className="mt-2 text-xs text-gray-500">
              この通知は手動で閉じるまで表示されます
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={() => onRemove(notification.id)}
          className={`
            flex-shrink-0 ml-2 ${styles.closeColor} 
            hover:bg-white hover:bg-opacity-20 rounded-full p-1
            transition-colors duration-200
          `}
          aria-label="通知を閉じる"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* プログレスバー（非永続通知の場合） */}
      {!notification.persistent &&
        notification.duration &&
        notification.duration > 0 && (
          <div className="mt-3 w-full bg-white bg-opacity-30 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all ease-linear ${
                notification.type === 'success'
                  ? 'bg-green-400'
                  : notification.type === 'error'
                    ? 'bg-red-400'
                    : notification.type === 'warning'
                      ? 'bg-yellow-400'
                      : 'bg-blue-400'
              }`}
              style={{
                width: '100%',
                animation: `shrink ${notification.duration}ms linear forwards`,
              }}
            />
          </div>
        )}
    </div>
  );
}
