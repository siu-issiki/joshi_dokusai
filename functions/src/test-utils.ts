/* eslint-disable */
/**
 * 共通テストユーティリティ
 * 各テストファイルで共通利用するモック、ヘルパー関数を提供
 */

import * as admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import * as logger from 'firebase-functions/logger';

// Firebase Admin SDKをテスト用に初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
    databaseURL: 'https://test-project-default-rtdb.firebaseio.com/',
  });
}

// モック型定義
export interface MockRef {
  once: any;
  set: any;
  update: any;
  push: any;
  child: any;
  transaction: any;
}

export interface MockDatabase {
  ref: any;
}

// Firebase Functions v2のモック
jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((handler) => handler),
}));

// Firebase Functions loggerのモック
jest.mock('firebase-functions/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Firebase Admin Database のモック
jest.mock('firebase-admin/database', () => {
  const mockRef: MockRef = {
    once: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    push: jest.fn(),
    child: jest.fn((): MockRef => mockRef),
    transaction: jest.fn(),
  };

  const mockDatabase: MockDatabase = {
    ref: jest.fn(() => mockRef),
  };

  return {
    getDatabase: jest.fn(() => mockDatabase),
  };
});

// テストヘルパー関数
export function getMockDatabase(): MockDatabase {
  return getDatabase() as any;
}

export function getMockRef(): MockRef {
  const mockDatabase = getMockDatabase();
  return mockDatabase.ref();
}

export function getMockLogger() {
  return logger as any;
}

// テストデータ生成ヘルパー
export function createMockGameData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-game',
    roomId: 'test-room',
    status: 'playing',
    phase: 'dictatorship',
    currentPlayerIndex: 0,
    turnCount: 1,
    maxTurns: 5,
    players: {},
    gameState: {
      deckCount: 50,
      discardPile: [],
      dictatorshipEffects: {
        nullificationsUsed: {
          boss4Players: 0,
          boss3Players: 0,
        },
      },
    },
    turnHistory: [],
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    ...overrides,
  };
}

export function createMockPlayerData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-player',
    name: 'Test Player',
    role: 'boss',
    life: 7,
    maxLife: 7,
    handCount: 7,
    isConnected: true,
    lastAction: Date.now(),
    ...overrides,
  };
}

export function createMockRoomData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-room',
    status: 'waiting',
    players: {},
    createdBy: 'test-user',
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockRequest(data: Record<string, unknown> = {}, uid: string = 'test-user') {
  return {
    auth: { uid },
    data,
  };
}

// モックのリセット関数
export function resetAllMocks() {
  jest.clearAllMocks();
}

// エラーハンドリングヘルパー
export async function expectAsyncError(fn: () => Promise<any>, expectedMessage: string): Promise<void> {
  try {
    await fn();
    expect(true).toBe(false); // Should not reach here
  } catch (error: any) {
    expect(error.message).toContain(expectedMessage);
  }
}

// テストヘルパーの拡張
export function expectValidGameState(gameState: any): void {
  expect(gameState.id).toBeDefined();
  expect(gameState.status).toBe('playing');
  expect(gameState.turnCount).toBeGreaterThan(0);
  expect(Array.isArray(gameState.turnHistory)).toBe(true);
}

export function expectValidPlayerState(playerState: any): void {
  expect(playerState.id).toBeDefined();
  expect(['boss', 'subordinate']).toContain(playerState.role);
  expect(playerState.life).toBeGreaterThanOrEqual(0);
  expect(playerState.handCount).toBeGreaterThanOrEqual(0);
  expect(typeof playerState.isConnected).toBe('boolean');
}

export function expectValidCardStructure(card: any): void {
  expect(card.id).toBeDefined();
  expect(typeof card.id).toBe('string');
  expect(card.type).toBeDefined();
  expect(card.name).toBeDefined();
  expect(typeof card.name).toBe('string');
}

// テスト後のクリーンアップ
afterEach(() => {
  resetAllMocks();
});
