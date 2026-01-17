import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig({
  base: '/tantantang/',
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/tantantang/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 打包输出到后端的 public/tantantang 目录
    outDir: resolve(__dirname, '../backend/public/tantantang'),
    emptyOutDir: true, // 打包前清空目录
  },
})
