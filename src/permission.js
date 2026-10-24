// 路由守卫：登录态校验与页面标题
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style

import { getPermissionStore, getToken } from '@/store';
import router from '@/router';

const permissionStore = getPermissionStore();
const userStore = getToken();

// 页面加载进度
NProgress.configure({ showSpinner: false });

// 登录状态校验
router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const { token } = userStore;
  
  if (token) {
    if (to.path === '/login') {
      userStore.logout();
      permissionStore.restore();
      next();
      return;
    }
    if (to.path !== '/login'){
      next();
    }
  } else {
    // 未登录时仍允许浏览首页、课程列表与课程详情
    next()
  }
});

// 站点标题，路由未定义 meta.title 时回落到它
const BASE_TITLE = '知微 · 在线学习平台';

router.afterEach((to) => {
  NProgress.done();
  // 浏览器标签页标题跟随路由 meta.title
  const pageTitle = to.meta && to.meta.title;
  document.title = pageTitle ? `${pageTitle} - ${BASE_TITLE}` : BASE_TITLE;
});
