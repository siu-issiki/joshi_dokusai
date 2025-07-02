import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Firebase Hostingでの動的ルーティング対応のため、static exportを無効化
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Firebase Hosting用の設定
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',
};

export default nextConfig;
