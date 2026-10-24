// 项目配置页面
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader';
import path from 'path';

const CWD = process.cwd();

//配置参考 https://vitejs.dev/config/
export default defineConfig((mode) => {
  // const { VITE_BASE_URL } = loadEnv(mode, CWD);
  return {
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      vue(),
      // svgLoader 默认把 .svg 导入编译成 Vue 组件，导致 <img :src="xxx"> 拿到的是
      // 组件对象（渲染成 [object Object]）而破图。这里改成默认导出 URL 字符串，
      // 需要当组件用的 svg 显式加 ?component 后缀。
      svgLoader({ defaultImport: 'url' })
    ],
    server: {
      port: 18082,
      host: '0.0.0.0',
      proxy: {
        // 后端返回的课程封面/默认头像走 /img-tx/ 前缀，由虚拟机 nginx 反代到对象存储。
        // 开发环境指向自己的网关域名，不再依赖第三方地址。
        '/img-tx': {
          target: 'http://www.zhiwei.com',
          changeOrigin: true,
        },
        // 上传到阿里云 OSS 的图片走 /img-ali/ 前缀（FilePlatform.ALI 的 path），
        // 同样由虚拟机 nginx 反代到 OSS bucket。
        '/img-ali': {
          target: 'http://www.zhiwei.com',
          changeOrigin: true,
        }
      }
    },
  }
})
