import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import {
  ref,
  onValue,
  off,
  set,
  remove,
  runTransaction,
} from 'firebase/database';
import {
  FirebaseRoom,
  generateRoomId,
  FirebasePaths,
  isRoomFull,
  areAllPlayersReady,
} from '@/types/firebase';
import { useAuth } from '@/lib/auth';

export function useRooms() {
  const [rooms, setRooms] = useState<FirebaseRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !database) {
      setLoading(false);
      return;
    }

    const roomsRef = ref(database, FirebasePaths.rooms());

    const unsubscribe = onValue(
      roomsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const roomList = Object.values(data) as FirebaseRoom[];
            // 待機中のルームのみフィルタ
            const waitingRooms = roomList.filter(
              (room) => room.status === 'waiting'
            );
            setRooms(waitingRooms);
          } else {
            setRooms([]);
          }
          setError(null);
        } catch (err) {
          console.error('ルーム一覧取得エラー:', err);
          setError('ルーム一覧の取得に失敗しました');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('ルーム監視エラー:', error);
        setError('ルーム情報の監視でエラーが発生しました');
        setLoading(false);
      }
    );

    return () => off(roomsRef, 'value', unsubscribe);
  }, [user]);

  const createRoom = async (
    roomName: string,
    maxPlayers: number,
    isPrivate: boolean = false,
    password?: string
  ): Promise<string> => {
    if (!user || !database) {
      throw new Error('認証またはデータベース接続が必要です');
    }

    if (!roomName.trim()) {
      throw new Error('ルーム名を入力してください');
    }

    if (maxPlayers < 4 || maxPlayers > 5) {
      throw new Error('プレイヤー数は4-5人で設定してください');
    }

    if (isPrivate && !password) {
      throw new Error('プライベートルームにはパスワードが必要です');
    }

    try {
      const roomId = generateRoomId();
      const now = Date.now();

      const roomData: FirebaseRoom = {
        id: roomId,
        name: roomName.trim(),
        createdBy: user.uid,
        createdAt: now,
        maxPlayers,
        currentPlayers: 1,
        isPrivate,
        status: 'waiting',
        players: {
          [user.uid]: {
            id: user.uid,
            name:
              localStorage.getItem('playerName') ||
              `プレイヤー${user.uid.slice(-4)}`,
            isReady: false,
            joinedAt: now,
          },
        },
      };

      // プライベートルームの場合のみpasswordを追加
      if (isPrivate && password) {
        roomData.password = password;
      }

      await set(ref(database, FirebasePaths.room(roomId)), roomData);
      console.log('ルーム作成成功:', roomId);
      return roomId;
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`ルームの作成に失敗しました: ${message}`);
    }
  };

  const deleteRoom = async (roomId: string): Promise<void> => {
    if (!user || !database) {
      throw new Error('認証またはデータベース接続が必要です');
    }

    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      throw new Error('ルームが見つかりません');
    }

    if (room.createdBy !== user.uid) {
      throw new Error('ルームの削除権限がありません');
    }

    try {
      await remove(ref(database, FirebasePaths.room(roomId)));
      console.log('ルーム削除成功:', roomId);
    } catch (error) {
      console.error('ルーム削除エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`ルームの削除に失敗しました: ${message}`);
    }
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    deleteRoom,
    // ヘルパー関数
    canCreateRoom: !!user,
    totalRooms: rooms.length,
  };
}

// 特定のルームの詳細情報を管理するフック
export function useRoom(roomId: string) {
  const [room, setRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId || !user || !database) {
      setLoading(false);
      return;
    }

    const roomRef = ref(database, FirebasePaths.room(roomId));

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          setRoom(data);
          setError(null);
        } catch (err) {
          console.error('ルーム詳細取得エラー:', err);
          setError('ルーム情報の取得に失敗しました');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('ルーム監視エラー:', error);
        setError('ルーム情報の監視でエラーが発生しました');
        setLoading(false);
      }
    );

    return () => off(roomRef, 'value', unsubscribe);
  }, [roomId, user]);

  const joinRoom = async (
    playerName: string,
    password?: string
  ): Promise<void> => {
    if (!user || !room || !database) {
      throw new Error(
        'ユーザー、ルーム、またはデータベース接続が見つかりません'
      );
    }

    if (!playerName.trim()) {
      throw new Error('プレイヤー名を入力してください');
    }

    if (room.isPrivate && room.password !== password) {
      throw new Error('パスワードが間違っています');
    }

    if (isRoomFull(room)) {
      throw new Error('ルームが満員です');
    }

    if (room.players[user.uid]) {
      throw new Error('既にこのルームに参加しています');
    }

    try {
      const playerData = {
        id: user.uid,
        name: playerName.trim(),
        isReady: false,
        joinedAt: Date.now(),
      };

      // プレイヤー情報を追加
      await set(
        ref(database, FirebasePaths.roomPlayer(roomId, user.uid)),
        playerData
      );

      // プレイヤー数を原子的に更新（トランザクション使用）
      await runTransaction(
        ref(database, `${FirebasePaths.room(roomId)}/currentPlayers`),
        (currentCount) => {
          // currentCountがnullの場合は0として扱う
          const count = currentCount ?? 0;
          return count + 1;
        }
      );

      // ローカルストレージにプレイヤー名を保存
      localStorage.setItem('playerName', playerName.trim());

      console.log('ルーム参加成功:', roomId);
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`ルームへの参加に失敗しました: ${message}`);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!user || !room || !database) {
      throw new Error(
        'ユーザー、ルーム、またはデータベース接続が見つかりません'
      );
    }

    if (!room.players[user.uid]) {
      throw new Error('このルームに参加していません');
    }

    try {
      // プレイヤー情報を削除
      await remove(ref(database, FirebasePaths.roomPlayer(roomId, user.uid)));

      // プレイヤー数を原子的に更新（トランザクション使用）
      await runTransaction(
        ref(database, `${FirebasePaths.room(roomId)}/currentPlayers`),
        (currentCount) => {
          // currentCountがnullの場合は0として扱う
          const count = currentCount ?? 0;
          // 0未満にならないように制限
          return Math.max(0, count - 1);
        }
      );

      console.log('ルーム退出成功:', roomId);
    } catch (error) {
      console.error('ルーム退出エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`ルームからの退出に失敗しました: ${message}`);
    }
  };

  const toggleReady = async (): Promise<void> => {
    if (!user || !room || !database) {
      throw new Error(
        'ユーザー、ルーム、またはデータベース接続が見つかりません'
      );
    }

    const currentPlayer = room.players[user.uid];
    if (!currentPlayer) {
      throw new Error('このルームに参加していません');
    }

    try {
      await set(
        ref(database, `${FirebasePaths.roomPlayer(roomId, user.uid)}/isReady`),
        !currentPlayer.isReady
      );

      console.log('準備状態変更成功:', !currentPlayer.isReady);
    } catch (error) {
      console.error('準備状態変更エラー:', error);
      const message = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`準備状態の変更に失敗しました: ${message}`);
    }
  };

  return {
    room,
    loading,
    error,
    joinRoom,
    leaveRoom,
    toggleReady,
    // ヘルパー関数
    isInRoom: !!(room && user && room.players[user.uid]),
    isRoomOwner: !!(room && user && room.createdBy === user.uid),
    canStartGame: !!(
      room &&
      user &&
      room.createdBy === user.uid &&
      areAllPlayersReady(room)
    ),
    playerCount: room?.currentPlayers || 0,
    maxPlayers: room?.maxPlayers || 5,
  };
}
