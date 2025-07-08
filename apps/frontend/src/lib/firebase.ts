import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化（ブラウザ環境でのみ）
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;
let functions: Functions | null = null;

// エミュレーター接続状態を追跡
let functionsEmulatorConnected = false;

if (typeof window !== 'undefined') {
  // デバッグ用：環境変数の確認
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? '設定済み' : '未設定',
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId ? '設定済み' : '未設定',
    nodeEnv: process.env.NODE_ENV,
  });

  if (firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      database = getDatabase(app);
      functions = getFunctions(app, 'asia-northeast1');

      // エミュレーターに接続（開発環境かつ環境変数で有効化されている場合）
      const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';
      if (useEmulator && !functionsEmulatorConnected) {
        try {
          // Functions Emulator
          connectFunctionsEmulator(functions, 'localhost', 5001);
          functionsEmulatorConnected = true;
          console.log('Firebase Functions Emulator connected to localhost:5001');
        } catch (error) {
          console.warn('Functions Emulator connection failed:', error);
        }
      }

      console.log('Firebase初期化成功');
    } catch (error) {
      console.error('Firebase初期化エラー:', error);
    }
  } else {
    console.error('Firebase設定エラー: projectIdが設定されていません');
  }
}

// Firebase サービスをexport
export { auth, database, functions };

export default app;
