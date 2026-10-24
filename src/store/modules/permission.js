import { defineStore } from 'pinia';
import router from '@/router';
import { store } from '@/store';

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 被动态移除、需要恢复的路由
    removeRoutes: [],
  }),
  actions: {
    // 恢复被移除的路由（例如重新登录后）
    async restore() {
      this.removeRoutes.forEach((item) => {
        router.addRoute(item);
      });
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}
