import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, off, set, runTransaction } from 'firebase/database';
import {
  FirebaseRoom,
  FirebaseRoomPlayer,
  FirebasePaths,
  handleFirebaseError,
  generateRoomId,
  GAME_CONFIG,
} from '@joshi-dokusai/shared';
import { useAuth } from '@/lib/auth';

interface UseRoomReturn {
  room: FirebaseRoom | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  // ルーム操作
  createRoom: (
    name: string,
    maxPlayers: number,
    isPrivate?: boolean,
    password?: string
  ) => Promise<string>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  // ヘルパー
  isRoomOwner: boolean;
  canStartGame: boolean;
  myPlayer: FirebaseRoomPlayer | null;
}

/**
 * ルーム管理フック
 * ルームの作成、参加、離脱、準備状態の管理を行う
 */
export function useRoom(roomId: string | null): UseRoomReturn {
  const [room, setRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const roomRef = ref(database, FirebasePaths.room(roomId));

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        try {
          const data = snapshot.val();

          if (data) {
            // データ正規化
            const normalizedRoom: FirebaseRoom = {
              ...data,
              players: data.players || {},
            };

            setRoom(normalizedRoom);
          } else {
            setRoom(null);
            setError('ルームが見つかりません');
          }

          setLoading(false);
          setConnected(true);
        } catch (err) {
          console.error('Room data parsing error:', err);
          const { message } = handleFirebaseError(err);
          setError(`ルーム情報の解析に失敗しました: ${message}`);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Room error:', err);
        const { message } = handleFirebaseError(err);
        setError(`ルーム情報の取得に失敗しました: ${message}`);
        setLoading(false);
        setConnected(false);
      }
    );

    // 接続状態の監視
    const connectedRef = ref(database, '.info/connected');
    const connectionUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);

      if (!isConnected) {
        setError('接続が切断されました。再接続を試行中...');
      } else if (error === '接続が切断されました。再接続を試行中...') {
        setError(null);
      }
    });

    return () => {
      off(roomRef, 'value', unsubscribe);
      off(connectedRef, 'value', connectionUnsubscribe);
    };
  }, [roomId, error]);

  /**
   * ルーム作成
   */
  const createRoom = async (
    name: string,
    maxPlayers: number,
    isPrivate = false,
    password?: string
  ): Promise<string> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setError(null);

    try {
      const roomId = generateRoomId();
      const now = Date.now();

      const roomData: FirebaseRoom = {
        id: roomId,
        name,
        createdBy: user.uid,
        createdAt: now,
        maxPlayers,
        currentPlayers: 1,
        isPrivate,
        password: isPrivate ? password : undefined,
        status: 'waiting',
        players: {
          [user.uid]: {
            id: user.uid,
            name: user.displayName || `プレイヤー${user.uid.slice(-4)}`,
            isReady: false,
            joinedAt: now,
          },
        },
      };

      await set(ref(database, FirebasePaths.room(roomId)), roomData);

      console.log('ルーム作成成功:', roomId);
      return roomId;
    } catch (err) {
      console.error('ルーム作成エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * ルーム参加
   */
  const joinRoom = async (
    targetRoomId: string,
    password?: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setError(null);

    try {
      await runTransaction(
        ref(database, FirebasePaths.room(targetRoomId)),
        (room) => {
          if (!room) {
            throw new Error('ルームが見つかりません');
          }

          if (room.status !== 'waiting') {
            throw new Error('ゲームは既に開始されています');
          }

          if (room.currentPlayers >= room.maxPlayers) {
            throw new Error('ルームが満員です');
          }

          if (room.isPrivate && room.password !== password) {
            throw new Error('パスワードが正しくありません');
          }

          if (room.players[user.uid]) {
            throw new Error('既にルームに参加しています');
          }

          // プレイヤーを追加
          room.players[user.uid] = {
            id: user.uid,
            name: user.displayName || `プレイヤー${user.uid.slice(-4)}`,
            isReady: false,
            joinedAt: Date.now(),
          };

          room.currentPlayers = Object.keys(room.players).length;

          return room;
        }
      );

      console.log('ルーム参加成功:', targetRoomId);
    } catch (err) {
      console.error('ルーム参加エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * ルーム離脱
   */
  const leaveRoom = async (): Promise<void> => {
    if (!user || !room) {
      throw new Error('ルーム情報が見つかりません');
    }

    setError(null);

    try {
      await runTransaction(
        ref(database, FirebasePaths.room(room.id)),
        (room) => {
          if (!room || !room.players[user.uid]) {
            return room;
          }

          // プレイヤーを削除
          delete room.players[user.uid];
          room.currentPlayers = Object.keys(room.players).length;

          // ルームが空になった場合は削除
          if (room.currentPlayers === 0) {
            return null;
          }

          // ルーム作成者が離脱した場合、次のプレイヤーに権限を移譲
          if (room.createdBy === user.uid) {
            const remainingPlayers = Object.values(
              room.players
            ) as FirebaseRoomPlayer[];
            if (remainingPlayers.length > 0) {
              room.createdBy = remainingPlayers[0].id;
            }
          }

          return room;
        }
      );

      console.log('ルーム離脱成功');
    } catch (err) {
      console.error('ルーム離脱エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * 準備状態の切り替え
   */
  const toggleReady = async (): Promise<void> => {
    if (!user || !room) {
      throw new Error('ルーム情報が見つかりません');
    }

    setError(null);

    try {
      const playerRef = ref(
        database,
        FirebasePaths.roomPlayer(room.id, user.uid)
      );
      await runTransaction(playerRef, (player) => {
        if (player) {
          player.isReady = !player.isReady;
        }
        return player;
      });

      console.log('準備状態変更成功');
    } catch (err) {
      console.error('準備状態変更エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    }
  };

  // ヘルパー値の計算
  const isRoomOwner = user && room ? room.createdBy === user.uid : false;
  const myPlayer = user && room ? room.players[user.uid] || null : null;

  const canStartGame = Boolean(
    room &&
      isRoomOwner &&
      room.currentPlayers >= GAME_CONFIG.MIN_PLAYERS &&
      Object.values(room.players).every((player) => player.isReady)
  );

  return {
    room,
    loading,
    error,
    connected,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    isRoomOwner,
    canStartGame,
    myPlayer,
  };
}
