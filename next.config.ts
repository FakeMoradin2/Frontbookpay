import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Next.js infiere la raíz del repo subiendo hasta un package-lock.json; aquí hay otro
// en el directorio padre, y Turbopack/Webpack resolvían `tailwindcss` allí (sin instalar).
// Forzamos la raíz de la app Next a esta carpeta (`frontend/`).
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.join(appRoot, "node_modules/tailwindcss"),
    };
    return config;
  },
};

export default nextConfig;
