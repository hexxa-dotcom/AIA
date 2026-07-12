import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fixa a raiz do workspace (evita que o Next escolha um lockfile solto de fora do projeto)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
