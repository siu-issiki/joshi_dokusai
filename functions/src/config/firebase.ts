/**
 * Firebase Admin設定
 */

import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions';

// Firebase Admin初期化
initializeApp();

// コスト制御のため最大インスタンス数を制限、リージョンを東京に設定
setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast1',
});
