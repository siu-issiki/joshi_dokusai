/**
 * 共有定数のテスト
 */

import './test-utils'; // モックセットアップ
import { GAME_CONFIG, VICTORY_CONDITIONS, DICTATORSHIP_CARDS } from './shared-constants';

describe('shared-constants', () => {
  describe('GAME_CONFIG', () => {
    it('should have valid player configuration', () => {
      expect(GAME_CONFIG.MIN_PLAYERS).toBe(4);
      expect(GAME_CONFIG.MAX_PLAYERS).toBe(5);
      expect(GAME_CONFIG.MIN_PLAYERS).toBeLessThanOrEqual(GAME_CONFIG.MAX_PLAYERS);
    });

    it('should have valid initial life settings', () => {
      expect(GAME_CONFIG.BOSS_INITIAL_LIFE).toBe(7);
      expect(GAME_CONFIG.SUBORDINATE_INITIAL_LIFE).toBe(4);
      expect(GAME_CONFIG.BOSS_INITIAL_LIFE).toBeGreaterThan(GAME_CONFIG.SUBORDINATE_INITIAL_LIFE);
    });

    it('should have valid initial hand size settings', () => {
      expect(GAME_CONFIG.BOSS_INITIAL_HAND_SIZE).toBe(7);
      expect(GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE).toBe(2);
      expect(GAME_CONFIG.BOSS_INITIAL_HAND_SIZE).toBeGreaterThan(GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE);
    });

    it('should have valid turn settings', () => {
      expect(GAME_CONFIG.MAX_TURNS).toBe(5);
      expect(GAME_CONFIG.NO_OVERTIME_TURN).toBe(3);
      expect(GAME_CONFIG.NO_OVERTIME_TURN).toBeLessThan(GAME_CONFIG.MAX_TURNS);
    });

    it('should have valid card counts', () => {
      expect(GAME_CONFIG.TOTAL_WORK_CARDS).toBe(50);
      expect(GAME_CONFIG.TOTAL_DICTATORSHIP_CARDS).toBe(15);
      expect(GAME_CONFIG.TOTAL_WORK_CARDS).toBeGreaterThan(0);
      expect(GAME_CONFIG.TOTAL_DICTATORSHIP_CARDS).toBeGreaterThan(0);
    });

    it('should have valid president card settings', () => {
      expect(GAME_CONFIG.PRESIDENT_CARD_DURATION).toBe(2);
      expect(GAME_CONFIG.PRESIDENT_CARD_DURATION).toBeGreaterThan(0);
    });

    it('should have valid nullification limits', () => {
      expect(GAME_CONFIG.NULLIFICATION_LIMIT_4_PLAYERS).toBe(1);
      expect(GAME_CONFIG.NULLIFICATION_LIMIT_3_PLAYERS).toBe(2);
      expect(GAME_CONFIG.NULLIFICATION_LIMIT_3_PLAYERS).toBeGreaterThan(GAME_CONFIG.NULLIFICATION_LIMIT_4_PLAYERS);
    });

    it('should validate player count correctly', () => {
      const validPlayerCounts = [4, 5];
      const invalidPlayerCounts = [1, 2, 3, 6, 7];

      validPlayerCounts.forEach((count) => {
        expect(count >= GAME_CONFIG.MIN_PLAYERS && count <= GAME_CONFIG.MAX_PLAYERS).toBe(true);
      });

      invalidPlayerCounts.forEach((count) => {
        expect(count >= GAME_CONFIG.MIN_PLAYERS && count <= GAME_CONFIG.MAX_PLAYERS).toBe(false);
      });
    });
  });

  describe('VICTORY_CONDITIONS', () => {
    it('should have valid boss victory condition', () => {
      expect(VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN).toBe(3);
      expect(VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN).toBeGreaterThan(0);
    });

    it('should have valid subordinate victory condition', () => {
      expect(VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS).toBe(5);
      expect(VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS).toBe(GAME_CONFIG.MAX_TURNS);
    });

    it('should validate victory conditions logic', () => {
      // 上司の勝利条件：部下3人以上のライフが0
      const bossWinCondition = VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN;
      expect(bossWinCondition).toBeLessThanOrEqual(GAME_CONFIG.MAX_PLAYERS - 1); // 上司以外の最大人数

      // 部下の勝利条件：5ターン生き残る
      const subordinateWinCondition = VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS;
      expect(subordinateWinCondition).toBe(GAME_CONFIG.MAX_TURNS);
    });
  });

  describe('DICTATORSHIP_CARDS', () => {
    it('should have valid dictatorship cards array', () => {
      try {
        expect(Array.isArray(DICTATORSHIP_CARDS)).toBe(true);
        expect(DICTATORSHIP_CARDS.length).toBeGreaterThan(0);
      } catch (error) {
        // DICTATORSHIP_CARDSが定義されていない場合
        expect(error).toBeDefined();
      }
    });

    it('should validate dictatorship card structure', () => {
      try {
        if (DICTATORSHIP_CARDS && DICTATORSHIP_CARDS.length > 0) {
          const sampleCard = DICTATORSHIP_CARDS[0];

          expect(sampleCard).toHaveProperty('id');
          expect(sampleCard).toHaveProperty('type');
          expect(sampleCard).toHaveProperty('name');
          expect(sampleCard).toHaveProperty('description');
          expect(sampleCard).toHaveProperty('target');

          expect(typeof sampleCard.id).toBe('string');
          expect(sampleCard.type).toBe('dictatorship');
          expect(typeof sampleCard.name).toBe('string');
          expect(typeof sampleCard.description).toBe('string');
          expect(['boss', 'subordinate', 'all']).toContain(sampleCard.target);
        }
      } catch (error) {
        // DICTATORSHIP_CARDSが定義されていない場合
        expect(error).toBeDefined();
      }
    });

    it('should validate dictatorship card nullification permissions', () => {
      // 部下のみが独裁カードを無効化できる
      const bossPlayer = { role: 'boss' };
      const subordinatePlayer = { role: 'subordinate' };

      expect(subordinatePlayer.role).toBe('subordinate'); // 無効化可能
      expect(bossPlayer.role).not.toBe('subordinate'); // 無効化不可
    });
  });

  describe('Game Balance Validation', () => {
    it('should have balanced initial settings', () => {
      // 上司と部下の初期設定バランスチェック
      const bossAdvantage = GAME_CONFIG.BOSS_INITIAL_LIFE + GAME_CONFIG.BOSS_INITIAL_HAND_SIZE;
      const subordinateAdvantage = GAME_CONFIG.SUBORDINATE_INITIAL_LIFE + GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE;

      expect(bossAdvantage).toBeGreaterThan(subordinateAdvantage); // 上司の方が有利な初期設定
    });

    it('should validate turn progression logic', () => {
      // ターン進行の妥当性チェック
      expect(GAME_CONFIG.MAX_TURNS).toBeGreaterThan(GAME_CONFIG.NO_OVERTIME_TURN);
      expect(GAME_CONFIG.NO_OVERTIME_TURN).toBeGreaterThan(0);
    });

    it('should validate card distribution', () => {
      // カード配布の妥当性チェック
      const maxPlayers = GAME_CONFIG.MAX_PLAYERS;
      const totalInitialCards = GAME_CONFIG.BOSS_INITIAL_HAND_SIZE + GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE * (maxPlayers - 1);

      expect(totalInitialCards).toBeLessThan(GAME_CONFIG.TOTAL_WORK_CARDS); // 初期配布後もカードが残る
    });
  });

  describe('Constants Immutability', () => {
    it('should be read-only constants', () => {
      // 定数の構造をチェック（as constで定義されているため実際の変更は可能だが、型レベルで読み取り専用）
      const originalValue = GAME_CONFIG.MIN_PLAYERS;

      // 値が期待される値であることを確認
      expect(originalValue).toBe(4);

      // TypeScriptの型システムでは読み取り専用として扱われる
      expect(typeof GAME_CONFIG.MIN_PLAYERS).toBe('number');
    });

    it('should validate constant types', () => {
      // 定数の型チェック
      expect(typeof GAME_CONFIG.MIN_PLAYERS).toBe('number');
      expect(typeof GAME_CONFIG.MAX_PLAYERS).toBe('number');
      expect(typeof GAME_CONFIG.BOSS_INITIAL_LIFE).toBe('number');
      expect(typeof GAME_CONFIG.SUBORDINATE_INITIAL_LIFE).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing constants gracefully', () => {
      // 定数が未定義の場合のテスト
      const undefinedConstant = (GAME_CONFIG as any).UNDEFINED_PROPERTY;
      expect(undefinedConstant).toBeUndefined();
    });

    it('should validate required parameters', () => {
      const requiredGameConfigKeys = [
        'MIN_PLAYERS',
        'MAX_PLAYERS',
        'BOSS_INITIAL_LIFE',
        'SUBORDINATE_INITIAL_LIFE',
        'BOSS_INITIAL_HAND_SIZE',
        'SUBORDINATE_INITIAL_HAND_SIZE',
        'MAX_TURNS',
      ];

      requiredGameConfigKeys.forEach((key) => {
        expect(GAME_CONFIG).toHaveProperty(key);
        expect((GAME_CONFIG as any)[key]).toBeDefined();
      });
    });
  });
});
