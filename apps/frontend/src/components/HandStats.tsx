'use client';

import React from 'react';
import { FirebasePlayerHand } from '@joshi-dokusai/shared';
import { useHandStats } from '@/hooks/usePlayerHand';

interface HandStatsProps {
  hand: FirebasePlayerHand;
}

/**
 * 手札統計表示コンポーネント
 * カードタイプ別の枚数や統計情報を表示
 */
export default function HandStats({ hand }: HandStatsProps) {
  const stats = useHandStats(hand);

  if (stats.totalCards === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <div className="text-sm">手札がありません</div>
      </div>
    );
  }

  // 統計データの配列
  const statItems = [
    {
      label: '攻撃',
      count: stats.attackCards,
      color: 'bg-red-100 text-red-800',
      icon: '⚔️'
    },
    {
      label: '防御',
      count: stats.defenseCards,
      color: 'bg-blue-100 text-blue-800',
      icon: '🛡️'
    },
    {
      label: '回復',
      count: stats.healCards,
      color: 'bg-green-100 text-green-800',
      icon: '💚'
    },
    {
      label: '特殊',
      count: stats.specialCards,
      color: 'bg-purple-100 text-purple-800',
      icon: '✨'
    }
  ];

  // パーセンテージ計算
  const getPercentage = (count: number) => {
    return stats.totalCards > 0 ? Math.round((count / stats.totalCards) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      {/* 総合統計 */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">{stats.totalCards}</div>
        <div className="text-sm text-gray-600">総カード数</div>
      </div>

      {/* カテゴリ別統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`inline-flex items-center px-3 py-2 rounded-lg ${item.color}`}>
              <span className="mr-1">{item.icon}</span>
              <span className="font-semibold">{item.count}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {item.label} ({getPercentage(item.count)}%)
            </div>
          </div>
        ))}
      </div>

      {/* 詳細統計バー */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700">カード構成</div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className="h-full flex">
            {stats.attackCards > 0 && (
              <div 
                className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${getPercentage(stats.attackCards)}%` }}
                title={`攻撃: ${stats.attackCards}枚`}
              >
                {stats.attackCards > 0 && getPercentage(stats.attackCards) > 10 && stats.attackCards}
              </div>
            )}
            {stats.defenseCards > 0 && (
              <div 
                className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${getPercentage(stats.defenseCards)}%` }}
                title={`防御: ${stats.defenseCards}枚`}
              >
                {stats.defenseCards > 0 && getPercentage(stats.defenseCards) > 10 && stats.defenseCards}
              </div>
            )}
            {stats.healCards > 0 && (
              <div 
                className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${getPercentage(stats.healCards)}%` }}
                title={`回復: ${stats.healCards}枚`}
              >
                {stats.healCards > 0 && getPercentage(stats.healCards) > 10 && stats.healCards}
              </div>
            )}
            {stats.specialCards > 0 && (
              <div 
                className="bg-purple-500 h-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${getPercentage(stats.specialCards)}%` }}
                title={`特殊: ${stats.specialCards}枚`}
              >
                {stats.specialCards > 0 && getPercentage(stats.specialCards) > 10 && stats.specialCards}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 戦略ヒント */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-sm font-semibold text-blue-800 mb-1">戦略ヒント</div>
        <div className="text-xs text-blue-700">
          {stats.attackCards > stats.defenseCards + stats.healCards ? (
            '攻撃的な手札です。積極的に攻めましょう！'
          ) : stats.defenseCards + stats.healCards > stats.attackCards ? (
            '守備的な手札です。持久戦を心がけましょう。'
          ) : stats.specialCards > 2 ? (
            '特殊カードが豊富です。タイミングを見計らって使用しましょう。'
          ) : (
            'バランスの取れた手札です。状況に応じて使い分けましょう。'
          )}
        </div>
      </div>

      {/* 最終更新時刻 */}
      <div className="text-xs text-gray-400 text-center">
        最終更新: {new Date(hand.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
