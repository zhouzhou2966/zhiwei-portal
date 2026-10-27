// 路由配置 页面
import { createRouter, createWebHashHistory } from 'vue-router';

import baseRouters from './modules/base';
import componentsRouters from './modules/components';

// 存放动态路由
export const asyncRouterList = [...baseRouters, ...componentsRouters];

// 存放固定的路由
const defaultRouterList = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/index.vue'),
  },
  {
    path: '/',
    redirect: '/main/index',
    component: () => import('@/pages/layouts/index.vue'),
  },
  {
    // 兜底：任何匹配不到路由的路径都落到 404 页。
    // 原来只写死 `redirect: '/result/404'`，拼错的路径会被静默吃掉 —— 用户只看到一个 404 页，
    // 定位不到是哪次跳转写错了（10-27 侧边栏相对路径 bug 就是这么藏住的）。
    // 改成函数形式补一条 warn，下次再出现能直接从控制台看到非法 fullPath。
    path: '/:w+',
    name: '404Page',
    redirect: to => {
      console.warn('[router] 未匹配的路由，已重定向到 404：', to.fullPath);
      return '/result/404';
    },
  },
];

export const allRoutes = [...defaultRouterList, ...asyncRouterList];

const router = createRouter({
  history: createWebHashHistory(),
  routes: allRoutes,
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth',
    };
  },
});

export default router;
