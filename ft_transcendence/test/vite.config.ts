import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  // Development server config
  server: {
    host: true, // Listen on all addresses (for Docker)
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Separate Babylon.js into its own chunk for better caching
          babylon: ['@babylonjs/core', '@babylonjs/materials', '@babylonjs/loaders'],
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js'
  },

  // Optimizations
  optimizeDeps: {
    include: [
      '@babylonjs/core',
      '@babylonjs/materials', 
      '@babylonjs/loaders',
      'ammojs-typed'
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020'
    }
  },

  assetsInclude: ['**/*.wasm']
})