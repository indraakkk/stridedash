import { resolve } from 'node:path'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'

const __dirname = import.meta.dirname

export default defineConfig({
  server: {
    port: 3000,
    fs: {
      deny: ['/nix/store'],
    },
    watch: {
      ignored: ['**/.devenv/**', '**/.direnv/**', '**/nix/store/**'],
    },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    devtools(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    nitro({
      compatibilityDate: '2025-11-01',
      alias: { '~': resolve(__dirname, 'src') },
      serverDir: './server',
      serverAssets: [{ baseName: 'fonts', dir: resolve(__dirname, 'server/assets/fonts') }],
      rollupConfig: {
        external: [/\.node$/, /@napi-rs[\\/]canvas/],
      },
    }),
  ],
})
