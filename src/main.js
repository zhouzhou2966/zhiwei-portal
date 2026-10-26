import { createApp } from 'vue'
// 组件库
// element-plus 已改为按需引入（见 vite.config.js 的 ElementPlusResolver），
// 不再 `import ElementPlus` + `app.use(ElementPlus)` + 全量 dist/index.css。
// 下面两行是给「函数式组件」兜底的：
//   ElMessage / ElMessageBox 是手写 import 调用的，不经过模板编译，
//   resolver 管不到它们的样式，必须在这里显式引一次（各自会连带 base / button / input / overlay）。
// 全项目只有这两个函数式组件在用，ElLoading / ElNotification 均为 0 处，不用引。
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'swiper/scss';
import 'swiper/scss/pagination';
import App from './App.vue'
import '@/style/font_style/iconfont.css';
// 全局样式
import '@/style/index.scss';
// 权限-路由拦截
import './permission';
// 数据存储、路由
import { store } from './store';
import router from './router';

const app = createApp(App);

app.use(store);
app.use(router);

app.mount('#app')
