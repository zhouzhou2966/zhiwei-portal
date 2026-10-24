import { defineStore } from 'pinia';
import store from '@/store';
import { tryRefreshToken } from "@/utils/refreshToken";
import {
  setToken as persistToken,
  getToken as readToken,
  setUserInfo as persistUserInfo,
  getUserInfo as readUserInfo,
  clearAuth,
} from '@/utils/authToken';

export const useUserStore = defineStore('user', {
  id:"userInfo",
  // 凭据持久化统一交给 utils/authToken（localStorage / sessionStorage 由「7天免登录」决定）。
  // 这里刻意不再挂 pinia 的 persist：两套存储并存时后者会覆盖前者，
  // 表现就是「明明勾了免登录，关掉标签页还是掉线」。
  state: () => ({
    token: readToken() || '',
    userInfo: readUserInfo() || {},
  }),
  getters: {
    getToken: (state) => {
      return state.token;
    },
    getUserInfo: (state) => {
      return state.userInfo;
    },
  },
  actions: {
    // 记录用户token。remember = 是否勾选「7天免登录」
    async setToken(token, remember = false) {
      this.token = token;
      persistToken(token, remember);
    },
    // 记录登录时获取的用户信息
    async setUserInfo(userInfo) {
      this.userInfo = userInfo;
      persistUserInfo(userInfo);
    },
    async logout() {
      clearAuth();
      this.token = '';
      this.userInfo = {};
    },
    // 401 / 被踢时用：只清本地凭据，不请求后端（logout 是用户主动退出，语义不同）。
    // 必须存在的原因：clearAuth() 只动 sessionStorage/localStorage，而 pinia 里的
    // token/userInfo 是另一份缓存 —— 不同步的话，模板里直接读 store 的地方
    // （如 askDetails / ReplayForm 的 store.getUserInfo.icon）会继续显示成已登录，
    // 而 authToken 侧已经空了，两边状态割裂。
    async resetAuth() {
      clearAuth();
      this.token = '';
      this.userInfo = {};
    },
    async removeToken() {
      this.token = '';
    },
  },

});
async function refresh(){
  return await tryRefreshToken();
}
export function getToken() {
  return useUserStore(store);
}
export function isLogin(token) {
  if (readToken()) {
    return true;
  }
  return refresh()
}
