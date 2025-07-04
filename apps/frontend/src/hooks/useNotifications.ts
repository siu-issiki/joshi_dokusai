import { useState, useCallback, useEffect, useRef } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  timestamp: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // ヘルパー関数
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, persistent?: boolean) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
}

/**
 * 通知管理フック
 * アプリケーション全体の通知システムを管理
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // タイマーIDを管理するためのMapをRefで保持
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 通知を追加
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration ?? 5000, // デフォルト5秒
      };

      setNotifications((prev) => [...prev, newNotification]);

      // 自動削除（persistentでない場合）
      if (
        !notification.persistent &&
        newNotification.duration &&
        newNotification.duration > 0
      ) {
        const timerId = setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          // タイマーMapからも削除
          timersRef.current.delete(id);
        }, newNotification.duration);

        // タイマーIDをMapに保存
        timersRef.current.set(id, timerId);
      }

      return id;
    },
    []
  );

  // 通知を削除
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    // 対応するタイマーがあれば停止して削除
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
  }, []);

  // 全通知をクリア
  const clearAll = useCallback(() => {
    setNotifications([]);

    // 全てのタイマーを停止
    timersRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    timersRef.current.clear();
  }, []);

  // クリーンアップ関数 - 全てのタイマーを停止
  const cleanup = useCallback(() => {
    timersRef.current.forEach((timerId) => {
      clearTimeout(timerId);
    });
    timersRef.current.clear();
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ヘルパー関数
  const showSuccess = useCallback(
    (title: string, message: string, duration = 5000) => {
      return addNotification({ type: 'success', title, message, duration });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message: string, persistent = false) => {
      return addNotification({
        type: 'error',
        title,
        message,
        persistent,
        duration: persistent ? 0 : 8000,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string, duration = 6000) => {
      return addNotification({ type: 'warning', title, message, duration });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string, duration = 4000) => {
      return addNotification({ type: 'info', title, message, duration });
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

/**
 * ゲーム固有の通知フック
 * ゲームイベントに特化した通知機能を提供
 */
export function useGameNotifications() {
  const { showSuccess, showError, showWarning, showInfo, ...rest } =
    useNotifications();

  // ゲーム開始通知
  const notifyGameStart = useCallback(
    (playerCount: number, myRole: 'boss' | 'subordinate') => {
      const roleText = myRole === 'boss' ? '上司' : '部下';
      return showSuccess(
        'ゲーム開始！',
        `${playerCount}人でゲームが開始されました。あなたは${roleText}です。`,
        6000
      );
    },
    [showSuccess]
  );

  // ターン開始通知
  const notifyTurnStart = useCallback(
    (isMyTurn: boolean, currentPlayerName: string) => {
      if (isMyTurn) {
        return showInfo(
          'あなたのターンです',
          'カードを選択してアクションを実行してください。',
          0 // ターン中は表示し続ける
        );
      } else {
        return showInfo(
          `${currentPlayerName}のターン`,
          '他のプレイヤーのアクションを待っています。',
          3000
        );
      }
    },
    [showInfo]
  );

  // カードプレイ通知
  const notifyCardPlayed = useCallback(
    (playerName: string, cardName: string, targetName?: string) => {
      const message = targetName
        ? `${playerName}が${targetName}に「${cardName}」を使用しました。`
        : `${playerName}が「${cardName}」を使用しました。`;

      return showInfo('カードが使用されました', message, 4000);
    },
    [showInfo]
  );

  // ダメージ通知
  const notifyDamage = useCallback(
    (targetName: string, damage: number, isMe: boolean) => {
      const title = isMe ? 'ダメージを受けました！' : 'ダメージが発生しました';
      const message = `${targetName}が${damage}ダメージを受けました。`;

      return isMe
        ? showWarning(title, message, 5000)
        : showInfo(title, message, 3000);
    },
    [showWarning, showInfo]
  );

  // 回復通知
  const notifyHeal = useCallback(
    (targetName: string, healAmount: number, isMe: boolean) => {
      const title = isMe ? 'ライフが回復しました！' : 'ライフが回復されました';
      const message = `${targetName}が${healAmount}ライフ回復しました。`;

      return showSuccess(title, message, 4000);
    },
    [showSuccess]
  );

  // プレイヤー脱落通知
  const notifyPlayerDefeated = useCallback(
    (playerName: string, isMe: boolean) => {
      if (isMe) {
        return showError(
          'あなたは脱落しました',
          'ライフが0になりました。ゲームの結果を見守りましょう。',
          true
        );
      } else {
        return showWarning(
          'プレイヤーが脱落しました',
          `${playerName}が脱落しました。`,
          5000
        );
      }
    },
    [showError, showWarning]
  );

  // ゲーム終了通知
  const notifyGameEnd = useCallback(
    (winner: 'boss' | 'subordinate', isWinner: boolean, reason: string) => {
      const winnerText = winner === 'boss' ? '上司' : '部下';
      const title = isWinner ? '勝利！' : '敗北...';
      const message = `${winnerText}の勝利です。${reason}`;

      return isWinner
        ? showSuccess(title, message, 10000)
        : showError(title, message, true);
    },
    [showSuccess, showError]
  );

  // 特殊イベント通知
  const notifySpecialEvent = useCallback(
    (eventName: string, description: string) => {
      switch (eventName) {
        case 'no_overtime':
          return showWarning(
            'ノー残業デー発動！',
            '3ターン目に入りました。攻撃カードが無効化されます。',
            6000
          );
        case 'final_turn':
          return showWarning(
            '最終ターン！',
            'これが最後のターンです。勝負の行方は？',
            8000
          );
        case 'dictatorship_nullified':
          return showInfo(
            '独裁カード無効化',
            '独裁カードの効果が無効化されました。',
            4000
          );
        default:
          return showInfo(eventName, description, 4000);
      }
    },
    [showWarning, showInfo]
  );

  // 接続エラー通知
  const notifyConnectionError = useCallback(() => {
    return showError(
      '接続エラー',
      'サーバーとの接続が切断されました。再接続を試行中...',
      true
    );
  }, [showError]);

  // 接続復旧通知
  const notifyConnectionRestored = useCallback(() => {
    return showSuccess('接続復旧', 'サーバーとの接続が復旧しました。', 3000);
  }, [showSuccess]);

  return {
    ...rest,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // ゲーム固有の通知
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
  };
}
