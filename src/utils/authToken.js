/**
 * 登录凭据（token / userInfo）的存取封装。
 *
 * 为什么需要它：原来全项目一律用 sessionStorage，而 sessionStorage 的生命周期是
 * 「标签页会话」——关掉标签页就清空，「7天免登录」形同虚设（后端 refresh-token 给 7 天也没用，
 * 走 refresh 换新 token 那条路还依赖跨站 cookie：localhost:18082 → api.zhiwei.com
 * 跨站 + HTTP 下浏览器根本不会带上）。
 *
 * 分层策略（两层各司其职，缺一不可）：
 *   1. sessionStorage = 本标签页的当前身份，读写优先走它。
 *      sessionStorage 天然按标签页隔离 —— 这是「开两个页面登不同账号」能成立的前提。
 *   2. localStorage   = 勾了「7天免登录」时的持久身份，只在勾选时写入。
 *      标签页第一次读取且 sessionStorage 为空时，把它复制进 sessionStorage —— 这一步就是免登录的生效点。
 *
 * 为什么不能只用其中一个：
 *   - 只用 sessionStorage：关标签页就掉线，免登录是假的。
 *   - 只用 localStorage：同源共享，后登录的标签页会把先登录的覆盖掉。
 *     因为每次 HTTP 请求都要重新读 token，表现就是「两个页面过一会变成同一个账号」。
 */

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

/**
 * 读本标签页的凭据。
 * sessionStorage 有值就用它；没有则从 localStorage 恢复一次（免登录），并落到本标签页。
 */
function readScoped(key) {
  const scoped = sessionStorage.getItem(key)
  if (scoped != null) return scoped
  const persisted = localStorage.getItem(key)
  if (persisted != null) {
    sessionStorage.setItem(key, persisted)
  }
  return persisted
}

/** 当前是否处于「免登录」状态（localStorage 里有持久身份） */
function isRemembered() {
  return localStorage.getItem(TOKEN_KEY) != null
}

/**
 * 写入 token。remember = 是否勾选「7天免登录」。
 * 本标签页始终写 sessionStorage（保证多标签页互不干扰）；勾了才额外写 localStorage，供下次打开恢复。
 */
export function setToken(token, remember) {
  clearAuth()
  sessionStorage.setItem(TOKEN_KEY, token)
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getToken() {
  return readScoped(TOKEN_KEY)
}

export function hasToken() {
  return !!getToken()
}

/** 刷新拿到新 token：更新本标签页；若处于免登录状态，同步刷新持久身份 */
export function updateToken(token) {
  if (!token) return
  sessionStorage.setItem(TOKEN_KEY, token)
  if (isRemembered()) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

/** 用户信息跟 token 同步：本标签页必写，免登录状态才写持久层 */
export function setUserInfo(userInfo) {
  const raw = JSON.stringify(userInfo)
  sessionStorage.setItem(USER_INFO_KEY, raw)
  if (isRemembered()) {
    localStorage.setItem(USER_INFO_KEY, raw)
  }
}

export function getUserInfo() {
  const raw = readScoped(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

/**
 * 登出 / 401 时清理。
 * 注意：会一并清掉 localStorage 里的持久身份 —— 这是「登出」的正确语义
 * （否则关掉标签页重开又是登录态）。同源的其他标签页**当前会话不受影响**
 * （它们的 sessionStorage 还在），只是关掉重开时需要重新登录。
 */
export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}
