import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // 启用 standalone 模式用于 Docker 部署
};

export default nextConfig;
