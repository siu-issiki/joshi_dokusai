import { useCallback, useRef, useState, useMemo } from 'react';

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

interface UseSoundNotificationsReturn {
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

/**
 * 音声通知フック
 * ゲームイベントに応じた音声通知を管理
 */
export function useSoundNotifications(): UseSoundNotificationsReturn {
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

  // 設定を更新
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

      try {
        // AudioContextの初期化（ユーザーインタラクション後に実行される必要がある）
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );
        oscillator.type = type;

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
    [settings.enabled, settings.volume]
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

  // 音声パターンの定義
  const soundPatterns = useMemo(
    () => ({
      gameStart: () => {
        // 上昇する3音のファンファーレ
        setTimeout(() => createAndPlayTone(523, 0.2), 0); // C5
        setTimeout(() => createAndPlayTone(659, 0.2), 100); // E5
        setTimeout(() => createAndPlayTone(784, 0.4), 200); // G5
      },

      turnStart: () => {
        // 短い2音の通知
        createAndPlayTone(880, 0.15); // A5
        setTimeout(() => createAndPlayTone(1047, 0.15), 150); // C6
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
        setTimeout(() => createAndPlayTone(523, 0.1), 0); // C5
        setTimeout(() => createAndPlayTone(659, 0.1), 80); // E5
        setTimeout(() => createAndPlayTone(784, 0.2), 160); // G5
      },

      gameEnd: () => {
        // 終了を示す下降音
        setTimeout(() => createAndPlayTone(784, 0.2), 0); // G5
        setTimeout(() => createAndPlayTone(659, 0.2), 200); // E5
        setTimeout(() => createAndPlayTone(523, 0.4), 400); // C5
      },

      error: () => {
        // 不協和音による警告
        playChord([220, 233], 0.5, 'sawtooth'); // A3 + A#3
      },
    }),
    [createAndPlayTone, playChord]
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

  return {
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
}

/**
 * 音声設定コンポーネント用のヘルパーフック
 */
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
