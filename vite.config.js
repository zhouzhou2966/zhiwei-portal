// 项目配置页面
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
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
      svgLoader({ defaultImport: 'url' }),
      // element-plus 按需引入：模板里的 <el-*> 由本插件在编译期改写成按需 import，
      // 只把真正用到的组件及其样式打进包（原来全量引入，主 chunk 1002KB / gzip 332KB）。
      // ⚠️ 必须用 importStyle: 'css'，不能用 'sass'：
      //    src/style/element/index.scss 里那句 `@forward ... with ($colors: primary #1B4B6B)`
      //    从来没有生效过（main.js 引的是预编译 dist/index.css，不走 sass 源码），
      //    产物里 --el-color-primary 实际是默认 #409eff，全站主色靠 --color-main + !important 硬覆盖。
      //    一旦切到 sass 模式，这句 @forward 会被激活，全站主色会从 #409eff 变成 #1B4B6B。
      // ⚠️ directives: true 不能省：v-infinite-scroll 有 7 处，漏了首页下拉加载直接失效。
      Components({
        // 不扫描 src/components 做全局自动注册（项目里都是显式 import），只做 element-plus 解析
        dirs: [],
        dts: false,
        resolvers: [ElementPlusResolver({ importStyle: 'css', directives: true })],
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          // 把 Vue 生态单独拆一个 chunk。
          // 目的不是减小总体积，而是提升缓存命中：现在 vue 运行时和业务代码混在同一个
          // 386KB 的 index-*.js 里，业务代码改一行，用户就得把整个 386KB 重新下载一遍。
          // 拆开之后 vendor-vue 的 hash 不随业务代码变，二次访问只重下业务 chunk。
          // ⚠️ 刻意不拆 element-plus：它是按需引入的，组件本来就被拆成 el-table-column、
          //    el-select 等按路由懒加载的小 chunk，强行合并成一个大 vendor 反而会让
          //    首屏把所有组件都加载一遍。
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (
              id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router/') ||
              id.includes('node_modules/pinia/') ||
              id.includes('node_modules/pinia-use-persist/')
            ) {
              return 'vendor-vue'
            }
          },
        },
      },
    },
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
