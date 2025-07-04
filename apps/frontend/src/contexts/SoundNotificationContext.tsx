'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
  gameStart: boolean;
  turnStart: boolean;
  cardPlayed: boolean;
  damage: boolean;
  heal: boolean;
  gameEnd: boolean;
  error: boolean;
}

interface SoundNotificationContextType {
  settings: SoundSettings;
  updateSettings: (newSettings: Partial<SoundSettings>) => void;
  playSound: (
    soundType: keyof Omit<SoundSettings, 'enabled' | 'volume'>
  ) => void;
  // 個別の音声再生関数
  playGameStart: () => void;
  playTurnStart: () => void;
  playCardPlayed: () => void;
  playDamage: () => void;
  playHeal: () => void;
  playGameEnd: () => void;
  playError: () => void;
}

const SoundNotificationContext = createContext<
  SoundNotificationContextType | undefined
>(undefined);

export function SoundNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    // ローカルストレージから設定を読み込み
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundNotificationSettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // パースエラーの場合はデフォルト設定を使用
        }
      }
    }

    return {
      enabled: true,
      volume: 0.5,
      gameStart: true,
      turnStart: true,
      cardPlayed: true,
      damage: true,
      heal: true,
      gameEnd: true,
      error: true,
    };
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  // AudioContextの初期化
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API is not supported:', error);
      }
    }
    return audioContextRef.current;
  }, []);

  // 設定の更新
  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'soundNotificationSettings',
          JSON.stringify(updated)
        );
      }

      return updated;
    });
  }, []);

  // Web Audio APIを使用して音声を生成・再生
  const createAndPlayTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      if (!settings.enabled) return;

      const audioContext = initAudioContext();
      if (!audioContext) return;

      try {
        // AudioContextが停止している場合は再開
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );
        oscillator.type = type;

        // 音量設定を適用
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          settings.volume * 0.3,
          audioContext.currentTime + 0.01
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + duration
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.warn('音声再生に失敗しました:', error);
      }
    },
    [settings.enabled, settings.volume, initAudioContext]
  );

  // 複数の音を組み合わせて再生
  const playChord = useCallback(
    (
      frequencies: number[],
      duration: number,
      type: OscillatorType = 'sine'
    ) => {
      frequencies.forEach((freq) => createAndPlayTone(freq, duration, type));
    },
    [createAndPlayTone]
  );

  // タイムアウトを管理するヘルパー関数
  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // 音声パターンの定義
  const soundPatterns = useMemo(
    () => ({
      gameStart: () => {
        // 上昇する3音のファンファーレ
        createAndPlayTone(523, 0.2); // C5
        addTimeout(() => createAndPlayTone(659, 0.2), 100); // E5
        addTimeout(() => createAndPlayTone(784, 0.4), 200); // G5
      },

      turnStart: () => {
        // 短い2音の通知
        createAndPlayTone(880, 0.15); // A5
        addTimeout(() => createAndPlayTone(1047, 0.15), 150); // C6
      },

      cardPlayed: () => {
        // 軽快な単音
        createAndPlayTone(1319, 0.1, 'square'); // E6
      },

      damage: () => {
        // 低い警告音
        createAndPlayTone(220, 0.3, 'sawtooth'); // A3
      },

      heal: () => {
        // 明るい上昇音
        createAndPlayTone(523, 0.1); // C5
        addTimeout(() => createAndPlayTone(659, 0.1), 80); // E5
        addTimeout(() => createAndPlayTone(784, 0.2), 160); // G5
      },

      gameEnd: () => {
        // 終了を示す下降音
        createAndPlayTone(784, 0.2); // G5
        addTimeout(() => createAndPlayTone(659, 0.2), 200); // E5
        addTimeout(() => createAndPlayTone(523, 0.4), 400); // C5
      },

      error: () => {
        // 不協和音による警告
        playChord([220, 233], 0.5, 'sawtooth'); // A3 + A#3
      },
    }),
    [createAndPlayTone, addTimeout, playChord]
  );

  // 汎用音声再生関数
  const playSound = useCallback(
    (soundType: keyof Omit<SoundSettings, 'enabled' | 'volume'>) => {
      if (!settings.enabled || !settings[soundType]) return;

      const pattern = soundPatterns[soundType];
      if (pattern) {
        pattern();
      }
    },
    [settings, soundPatterns]
  );

  // 個別の音声再生関数
  const playGameStart = useCallback(() => playSound('gameStart'), [playSound]);
  const playTurnStart = useCallback(() => playSound('turnStart'), [playSound]);
  const playCardPlayed = useCallback(
    () => playSound('cardPlayed'),
    [playSound]
  );
  const playDamage = useCallback(() => playSound('damage'), [playSound]);
  const playHeal = useCallback(() => playSound('heal'), [playSound]);
  const playGameEnd = useCallback(() => playSound('gameEnd'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      // 全てのタイムアウトをクリア
      timeoutIdsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = [];

      // AudioContextをクローズ
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const value: SoundNotificationContextType = {
    settings,
    updateSettings,
    playSound,
    playGameStart,
    playTurnStart,
    playCardPlayed,
    playDamage,
    playHeal,
    playGameEnd,
    playError,
  };

  return (
    <SoundNotificationContext.Provider value={value}>
      {children}
    </SoundNotificationContext.Provider>
  );
}

export function useSoundNotifications(): SoundNotificationContextType {
  const context = useContext(SoundNotificationContext);
  if (context === undefined) {
    throw new Error(
      'useSoundNotifications must be used within a SoundNotificationProvider'
    );
  }
  return context;
}

export function useSoundSettings() {
  const { settings, updateSettings } = useSoundNotifications();

  const toggleEnabled = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  const setVolume = useCallback(
    (volume: number) => {
      updateSettings({ volume: Math.max(0, Math.min(1, volume)) });
    },
    [updateSettings]
  );

  const toggleSoundType = useCallback(
    (soundType: keyof Omit<SoundSettings, 'enabled' | 'volume'>) => {
      updateSettings({ [soundType]: !settings[soundType] });
    },
    [settings, updateSettings]
  );

  return {
    settings,
    toggleEnabled,
    setVolume,
    toggleSoundType,
    updateSettings,
  };
}
