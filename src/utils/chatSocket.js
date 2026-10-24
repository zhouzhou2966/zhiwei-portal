/**
 * 群聊 WebSocket 长连接封装（原生 WebSocket，不引第三方库）。
 *
 * 职责：
 * 1. 建连：ws 地址来自 config/proxy 的 host（与 axios 同源），token 拼在
 *    query 上——浏览器原生 WebSocket 不允许自定义请求头，这是唯一能带凭据的方式；
 * 2. 心跳：30s 一次 PING/PONG，防止网关/Nginx 把空闲连接掐掉；
 * 3. 重连：断线指数退避重连（3s 起、封顶 60s），重连成功后回调 OPEN
 *    让页面重新拉会话数据（断线期间的消息靠「位点补拉」接口兜底）；
 * 4. 事件分发：页面通过 onChat(type, cb) 订阅 CHAT / RECALL / PRESENCE / PROFILE_CHANGED /
 *    OPEN / CLOSE / ERROR 帧。
 *    RECALL 是「某条消息被撤回了」，页面把对应消息标记为已撤回而不是追加新消息；
 *    PRESENCE 是服务端推的「在线名单变了」（有人上线/下线），页面收到后重拉在线列表；
 *    PROFILE_CHANGED 是「某人换了昵称/头像」，页面把已渲染消息里的头像就地替换
 *    （服务端在资料变更时推，所以别人换头像自己不用刷新也能看到）。
 */

import proxy from '../config/proxy'
import { getToken } from './authToken'

const env = import.meta.env.MODE || 'development'
const host = (proxy[env] || proxy.development).host
const WS_URL = host.replace(/^http/, 'ws') + '/sms/ws'

const RECONNECT_BASE_DELAY = 3000
const RECONNECT_MAX_DELAY = 60000
const HEARTBEAT_INTERVAL = 30000

let ws = null
let heartbeatTimer = null
let reconnectTimer = null
let reconnectDelay = RECONNECT_BASE_DELAY
let closedByUser = false

const listeners = {
  CHAT: [],
  RECALL: [],
  PRESENCE: [],
  PROFILE_CHANGED: [],
  OPEN: [],
  CLOSE: [],
  ERROR: [],
}

function buildUrl() {
  const token = getToken() || ''
  return `${WS_URL}?authorization=${encodeURIComponent(token)}`
}

function clearTimers() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function startHeartbeat() {
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'PING' }))
    }
  }, HEARTBEAT_INTERVAL)
}

function scheduleReconnect() {
  if (closedByUser) return
  reconnectTimer = setTimeout(connectChatSocket, reconnectDelay)
  // 指数退避：3s → 6s → 12s ... 封顶 60s，避免服务端故障时雪崩重试
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY)
}

export function connectChatSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return
  }
  closedByUser = false
  clearTimers()
  const token = getToken()
  if (!token) {
    // 未登录不建连；登录后页面会重新调用本方法
    return
  }
  ws = new WebSocket(buildUrl())

  ws.onopen = () => {
    reconnectDelay = RECONNECT_BASE_DELAY
    startHeartbeat()
    listeners.OPEN.forEach((cb) => cb())
  }

  ws.onmessage = (event) => {
    let frame
    try {
      frame = JSON.parse(event.data)
    } catch (e) {
      console.warn('chatSocket: 非法帧', event.data)
      return
    }
    let type = frame.type
    // 容错：服务端若下发了不带 type 的消息体（只有消息字段），按聊天消息处理，
    // 避免协议不一致时消息被静默丢弃
    if (!type && frame.id != null && frame.content != null) {
      type = 'CHAT'
    }
    if (type === 'PONG') return
    ;(listeners[type] || []).forEach((cb) => cb(frame))
  }

  ws.onclose = () => {
    clearTimers()
    listeners.CLOSE.forEach((cb) => cb())
    scheduleReconnect()
  }

  ws.onerror = () => {
    // onerror 后必然触发 onclose，重连逻辑统一放在 onclose
    listeners.ERROR.forEach((cb) => cb())
  }
}

export function closeChatSocket() {
  closedByUser = true
  clearTimers()
  if (ws) {
    ws.close()
    ws = null
  }
}

export function onChat(type, cb) {
  if (!listeners[type]) return
  listeners[type].push(cb)
}

export function offChat(type, cb) {
  if (!listeners[type]) return
  listeners[type] = listeners[type].filter((f) => f !== cb)
}

/**
 * 发送聊天帧。返回 false 表示连接不可用，页面据此提示「连接已断开」。
 */
export function sendChatFrame(messageType, targetId, content) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false
  }
  ws.send(JSON.stringify({ type: 'CHAT', messageType, targetId, content }))
  return true
}

/**
 * 发送已读确认帧：告知服务端「该会话已读到 messageId」，
 * 服务端前推位点后未读数清零，这就是离线消息闭环的 ack。
 */
export function sendAckFrame(messageType, targetId, messageId) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false
  }
  ws.send(JSON.stringify({ type: 'ACK', messageType, targetId, messageId }))
  return true
}

/**
 * 发送撤回帧。只能撤自己发的消息，且服务端会再校验 2 分钟时间窗
 * （前端按钮的显隐只是体验，真正的约束在服务端）。
 */
export function sendRecallFrame(messageId) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false
  }
  ws.send(JSON.stringify({ type: 'RECALL', messageId }))
  return true
}

export function isChatSocketOpen() {
  return !!ws && ws.readyState === WebSocket.OPEN
}
