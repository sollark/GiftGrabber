/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enhanced performance optimizations
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    // Enable modern bundling optimizations
    turbo: {
      loaders: {
        ".svg": ["@svgr/webpack"],
      },
    },
  },

  // Advanced webpack optimizations for bundle size
  webpack: (config, { dev, isServer }) => {
    // Tree shaking for production builds
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        providedExports: true,
        // Enhanced tree shaking
        innerGraph: true,
        // Aggressive chunk splitting for better caching
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            // Separate MUI components into smaller chunks
            muiCore: {
              name: "mui-core",
              test: /[\\/]node_modules[\\/]@mui[\\/]material[\\/]/,
              priority: 40,
              chunks: "all",
            },
            muiIcons: {
              name: "mui-icons",
              test: /[\\/]node_modules[\\/]@mui[\\/]icons-material[\\/]/,
              priority: 35,
              chunks: "all",
            },
            // Split React and React-DOM into separate chunk
            react: {
              name: "react",
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 30,
              chunks: "all",
            },
            // Form libraries chunk
            forms: {
              name: "forms",
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              priority: 25,
              chunks: "all",
            },
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: "all",
            },
          },
        },
      };
    }

    // Client-side optimizations
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use smaller lodash-es for tree shaking
        lodash: "lodash-es",
      };
    }

    return config;
  },

  // Enhanced modular imports
  modularizeImports: {
    "@mui/material": {
      transform: "@mui/material/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
    lodash: {
      transform: "lodash/{{member}}",
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
