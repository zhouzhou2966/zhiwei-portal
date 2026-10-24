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
    path: '/:w+',
    name: '404Page',
    redirect: '/result/404',
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
