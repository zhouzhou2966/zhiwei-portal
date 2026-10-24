import axios from 'axios';
import proxy from '../config/proxy';
import { ElMessageBox } from 'element-plus';
import  router  from '../router';
import {tryRefreshToken} from './refreshToken'
import {mapBrandImages} from './brandImage'
import {getToken, clearAuth} from './authToken'
import pinia, {useUserStore} from '../store'

const env = import.meta.env.MODE || 'development';
const host = (proxy[env] || proxy.development).host;
const CODE = {
  LOGIN_TIMEOUT: 1000,
  REQUEST_SUCCESS: 200,
  REQUEST_FOBID: 1001,
};
// 登录异常弹窗去重标志。
// ⚠️ 必须在弹窗关闭后复位 —— 原来这个标志置 false 之后没有任何复位点，
// 于是「被踢一次之后，所有后续 401 都被静默吞掉」（请求直接 reject，页面像卡住、点了没反应）。
// 它只该防「并发 401 叠出多个弹窗」，不该变成一次性的。
let reloginShowing = false

/**
 * 统一取「错误提示文案」。
 *
 * ⚠️ 绝对不要写 `res.data.msg`。实测业务失败时后端返回的响应体是
 * `{"code":400,"msg":"用户登录信息错误","requestId":"..."}` —— **根本没有 data 字段**
 * （网关的 Jackson 配了 non_null 输出策略，`R.error()` 里 data 为 null 就被省掉了），
 * 所以 `res.data` 是 undefined，`res.data.msg` 直接抛 TypeError。
 * 这个 TypeError 又恰好发生在 `.then()` 回调里，会被后面的 `.catch()` 接住，
 * 于是页面显示的是兜底的「请求出错！」，后端真正的原因（如「服务不存在」「考试已参加过」）
 * 全被吞掉 —— 排查问题时极具误导性（本次学习页白屏就是这么被掩盖的）。
 *
 * @param res 业务响应体（形如 {code, msg, data, requestId}）
 * @param fallback 后端没给 msg 时的兜底文案
 */
export const errMsg = (res, fallback = '请求失败，请稍后重试') => res?.msg || fallback

/**
 * 统一取「catch 分支」的错误提示文案。
 *
 * catch 里拿到的不是业务响应体，而是三样不同的东西，不能直接套 errMsg：
 *   ① axios 错误且服务器有响应 —— 响应体可能带后端 msg（如网关的「服务不存在」），要透出；
 *   ② 超时 / 断网 —— 没有 e.response，任何兜底文案都比「请求出错！」有用；
 *   ③ 401 且刷新 token 失败 —— 拦截器直接 `return true`（不是 Error），
 *      此时已经弹过「重新登录」弹窗，这里必须返回空串避免再叠一条 toast。
 *
 * @param e catch 到的对象
 * @param fallback 服务器有响应但没给 msg 时的兜底文案
 * @returns {string} 空串表示「不要提示」
 */
export const catchMsg = (e, fallback = '请求失败，请稍后重试') => {
  if (e === true) return ''
  const resp = e && e.response
  // 401 一律不重复提示：拦截器已经弹了「未登录或登录超时」并清了 token。
  // ⚠️ 不能只判 e === true —— 实测 refresh 接口自己返回 401 时，
  //    tryRefreshToken 抛出的就是带 response.status=401 的 axios 错误，
  //    只判返回值会让页面在弹窗之上再叠一条 toast（2026-10-23 验证时踩到）。
  if (resp && resp.status === 401) return ''
  const body = resp && resp.data
  if (body && body.msg) return body.msg
  if (resp) return fallback
  return '网络异常，请检查网络后重试'
}

const instance = axios.create({
  baseURL: host,
  timeout: 1000,
  withCredentials: false,
});

instance.interceptors.request.use((config) => {
  const TOKEN = getToken();
  config.headers = {
    "Content-Type": "application/json",
    "authorization": TOKEN
  }  
  return config
});

instance.defaults.timeout = 5000;
async function refreshToken(err){
  // 尝试刷新token
  let success = await tryRefreshToken();
  if(success){
    return instance(err.config);
  }
  // 刷新失败 = 确实要重新登录。这里必须去重（见 showReloginDialogOnce）：
  // 聊天页进来会并发发多个请求（会话/在线/历史），若每个 401 各弹一个框，
  // 用户就得点掉一个又一个，表现为「要点四五次才跳到登录页」。
  showReloginDialogOnce();
  return true;
}
/**
 * 凭据失效的统一处理：清存储层 + 同步 pinia。
 * 只调 clearAuth() 是不够的 —— authToken（sessionStorage/localStorage）和 pinia 是两份缓存，
 * 不同步就会出现「存储层已经登出、模板里读 store 的地方还显示着登录态」的割裂。
 */
function clearAuthEverywhere() {
  clearAuth();
  useUserStore(pinia).resetAuth();
}
/**
 * 只弹一次「重新登录」。并发 401 时后续请求直接跳过，不再叠框；
 * 同时清掉本地 token，避免带着失效凭据继续打请求（也让 WS 停止重连）。
 * ⚠️ reloginShowing 必须在弹窗关闭后复位，否则后续 401 会被永久静默。
 */
function showReloginDialogOnce() {
  if (reloginShowing) {
    return;
  }
  reloginShowing = true;
  clearAuthEverywhere();
  ElMessageBox.alert(
    '请先登录！',
    '未登录或登录超时',
    {
      confirmButtonText: '重新登录',
    }
  )
    .then(() => {
      router.push('/login')
    })
    .catch(() => {
      // 用户按 ESC / 点 × 关闭弹窗，无需额外处理
    })
    .finally(() => {
      reloginShowing = false
    })
}
function alertLoginMessage() {
  if (reloginShowing) {
    return;
  }
  reloginShowing = true;
  clearAuthEverywhere();
  ElMessageBox.confirm(
    '您的账号登录超时或在其他机器登录，请重新登录或更换账号登录！',
    '登录超时',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '继续浏览',
      type: 'warning',
    }
    )
    .then(() => {
      router.push('/login')
    })
    .catch(() => {
      router.go(0)
    })
    .finally(() => {
      reloginShowing = false
    })
}
instance.interceptors.response.use(
  async (response) => {
    // 0.把外部图床的品牌图片地址换成本地资源（见 utils/brandImage.js）
    mapBrandImages(response.data);
    // 1.获取业务状态码
    let code = response.data.code;
    // 2.业务状态码为200，直接返回
    if (code === CODE.REQUEST_SUCCESS) {
      return response.data;
    }

    // 3.业务状态码为401，代表未登录
    if (code === 401) {
      alertLoginMessage();
    }

    // 4.其余业务状态码原样返回，由调用方按需提示，拦截器不统一弹错
    return response.data;
  },
   async (err) => {
    // err.response 可能为空（超时/断网），直接取 .status 会抛 TypeError 掩盖真实错误
    if(err.response && err.response.status === 401){
      // 登录异常或超时，刷新token
      return refreshToken(err);
    }
    return Promise.reject(err);
   },
);

export default instance;
