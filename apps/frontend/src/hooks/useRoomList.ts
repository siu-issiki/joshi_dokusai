import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import {
  FirebaseRoom,
  FirebasePaths,
  handleFirebaseError,
} from '@joshi-dokusai/shared';

interface UseRoomListReturn {
  rooms: FirebaseRoom[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  refreshRooms: () => void;
}

/**
 * ルーム一覧管理フック
 * 利用可能なルームの一覧を取得・監視する
 */
export function useRoomList(): UseRoomListReturn {
  const [rooms, setRooms] = useState<FirebaseRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  const refreshRooms = () => {
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 待機中のルームのみを取得
    const roomsRef = ref(database, FirebasePaths.rooms());
    const waitingRoomsQuery = query(
      roomsRef,
      orderByChild('status'),
      equalTo('waiting')
    );

    const unsubscribe = onValue(
      waitingRoomsQuery,
      (snapshot) => {
        try {
          const data = snapshot.val();

          if (data) {
            const roomList = Object.values(data) as FirebaseRoom[];

            // ルームを作成日時の降順でソート（新しいものが上）
            const sortedRooms = roomList.sort(
              (a, b) => b.createdAt - a.createdAt
            );

            setRooms(sortedRooms);
          } else {
            setRooms([]);
          }

          setLoading(false);
          setConnected(true);
        } catch (err) {
          console.error('Room list parsing error:', err);
          const { message } = handleFirebaseError(err);
          setError(`ルーム一覧の解析に失敗しました: ${message}`);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Room list error:', err);
        const { message } = handleFirebaseError(err);
        setError(`ルーム一覧の取得に失敗しました: ${message}`);
        setLoading(false);
        setConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 接続状態の監視を別のuseEffectで分離
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const connectionUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);

      if (!isConnected) {
        setError('接続が切断されました。再接続を試行中...');
      } else {
        // 接続復旧時は接続エラーのみクリア
        setError((prev) =>
          prev === '接続が切断されました。再接続を試行中...' ? null : prev
        );
      }
    });

    return () => {
      connectionUnsubscribe();
    };
  }, []);

  return {
    rooms,
    loading,
    error,
    connected,
    refreshRooms,
  };
}

/**
 * ルーム検索・フィルタリング用のヘルパーフック
 */
export function useRoomFilter(rooms: FirebaseRoom[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrivateRooms, setShowPrivateRooms] = useState(false);
  const [maxPlayersFilter, setMaxPlayersFilter] = useState<number | null>(null);

  const filteredRooms = rooms.filter((room) => {
    // 検索語でフィルタ
    if (
      searchTerm &&
      !room.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // プライベートルームフィルタ
    if (!showPrivateRooms && room.isPrivate) {
      return false;
    }

    // 最大プレイヤー数フィルタ
    if (maxPlayersFilter && room.maxPlayers !== maxPlayersFilter) {
      return false;
    }

    // 満員のルームは除外
    if (room.currentPlayers >= room.maxPlayers) {
      return false;
    }

    return true;
  });

  return {
    searchTerm,
    setSearchTerm,
    showPrivateRooms,
    setShowPrivateRooms,
    maxPlayersFilter,
    setMaxPlayersFilter,
    filteredRooms,
  };
}
