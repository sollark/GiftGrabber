/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },

  // Webpack optimizations for bundle size
  webpack: (config, { dev, isServer }) => {
    // Tree shaking for production builds
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        providedExports: true,
      };
    }

    // Optimize chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          mui: {
            name: "mui",
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            priority: 30,
            chunks: "all",
          },
          vendor: {
            name: "vendor",
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            chunks: "all",
          },
        },
      };
    }

    return config;
  },

  // Reduce bundle size by optimizing imports
  modularizeImports: {
    "@mui/material": {
      transform: "@mui/material/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
};

export default nextConfig;
