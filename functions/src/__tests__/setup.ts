import * as admin from "firebase-admin";

// Firebase Admin SDKをテスト用に初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
    databaseURL: "https://test-project-default-rtdb.firebaseio.com/",
  });
}

// テスト用のモック設定
jest.mock("firebase-functions/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Firebase Admin Database のモック
jest.mock("firebase-admin/database", () => {
  const mockRef: any = {
    once: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    push: jest.fn(),
    child: jest.fn((): any => mockRef),
    transaction: jest.fn(),
  };

  const mockDatabase = {
    ref: jest.fn(() => mockRef),
  };

  return {
    getDatabase: jest.fn(() => mockDatabase),
  };
});

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
});
