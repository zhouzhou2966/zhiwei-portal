import axios from 'axios';
import proxy from "../config/proxy";
import { updateToken, clearAuth } from './authToken'
const env = import.meta.env.MODE || 'development';
const host = (proxy[env] || proxy.development).host;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
let isRefresh = false;
let success = false;
export async function tryRefreshToken(){
  if(isRefresh){
    while (isRefresh){
      await sleep(10)
    }
    return success;
  }
  isRefresh = true;
  try {
    // 尝试刷新token
    let resp = await axios.get(host + "/as/accounts/refresh", {withCredentials: true});
    if (resp.status === 200 && resp.data.code === 200) {
      updateToken(resp.data.data)
      success = true;
    }else{
      clearAuth();
      success = false;
    }
  } catch (e) {
    // 刷新请求本身失败（非 2xx 会走这里，axios 对非 2xx 是 reject）：
    // 必须复位 isRefresh，否则后续所有 401 都会卡在 while(isRefresh) 里死等，
    // 表现是「页面像卡住、点了没反应」。
    clearAuth();
    success = false;
  } finally {
    isRefresh = false;
  }
  return success;
}
