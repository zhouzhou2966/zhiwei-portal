<template>
  <div class="chat-page">
    <!-- 左侧：会话列表 -->
    <aside class="chat-side">
      <div class="side-header">
        <span class="side-title">消息</span>
        <span class="online-tip" :class="{ offline: !connected }">
          {{ connected ? `在线 ${onlineCount} 人` : '连接断开，重连中…' }}
        </span>
      </div>

      <div class="side-actions">
        <el-button size="small" type="primary" plain @click="openOnlineUsers">
          在线用户
        </el-button>
      </div>

      <div
        v-for="session in sessions"
        :key="session.messageType + '-' + session.targetId"
        class="session-item"
        :class="{ active: isActive(session) }"
        @click="switchSession(session)"
      >
        <el-badge
          :value="session.unreadCount"
          :hidden="!(session.unreadCount > 0)"
          class="session-badge"
        >
          <el-avatar :size="40" :src="session.targetIcon || ''" class="session-avatar">
            {{ session.messageType === 2 ? '#' : (session.targetName || '友').slice(0, 1) }}
          </el-avatar>
        </el-badge>
        <div class="session-info">
          <div class="session-name">{{ session.targetName }}</div>
          <!-- 私聊不显示副标题（冗余，头像已能区分）；群聊保留「群聊」标识 -->
          <div v-if="session.messageType === 2" class="session-desc">群聊</div>
        </div>
      </div>
    </aside>

    <!-- 右侧：消息区 -->
    <main class="chat-main">
      <template v-if="activeSession">
        <div class="chat-header">
          {{ activeSession.targetName }}
          <span v-if="activeSession.memberCount" class="member-count">
            共 {{ activeSession.memberCount }} 人
          </span>
        </div>

        <div class="chat-body" ref="bodyRef" @scroll="onScroll">
          <div class="load-more" v-if="hasMoreHistory" @click="loadMore">
            {{ loadingHistory ? '加载中…' : '查看更早的消息' }}
          </div>
          <div v-if="!historyLoaded" class="empty-tip">加载中…</div>
          <div v-else-if="messages.length === 0" class="empty-tip">
            还没有消息，来说第一句吧（违禁词会被自动替换为 ***）
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="msg-row"
            :class="{ mine: msg.senderId === myUserId, recalled: msg.recalled }"
            @contextmenu="onMsgContextMenu($event, msg)"
          >
            <el-avatar :size="34" :src="msg.senderIcon || ''" class="msg-avatar">
              {{ (msg.senderName || '友').slice(0, 1) }}
            </el-avatar>
            <div class="msg-content">
              <div class="msg-meta">
                <span class="meta-name">
                  {{ msg.senderId === myUserId ? '我' : (msg.senderName || ('用户' + msg.senderId)) }}
                </span>
                <span class="meta-time">{{ formatTime(msg.sentAt) }}</span>
              </div>
              <!-- 已撤回：不渲染气泡，只留一行灰字占位（内容服务端已不下发） -->
              <div v-if="msg.recalled" class="msg-recalled">
                {{ msg.senderId === myUserId ? '你撤回了一条消息' : (msg.senderName || '对方') + '撤回了一条消息' }}
              </div>
              <div v-else class="msg-bubble">{{ msg.content }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="2"
            resize="none"
            maxlength="500"
            placeholder="输入消息，Enter 发送（违禁词会被替换为 ***）"
            @keydown.enter.exact.prevent="handleSend"
          />
          <el-button type="primary" :disabled="!draft.trim()" @click="handleSend">
            发送
          </el-button>
        </div>
      </template>
      <div v-else class="empty-tip main-empty">选择左侧会话开始聊天</div>
    </main>

    <!-- 在线用户：每个用户后面一个「私聊」按钮 -->
    <el-dialog v-model="onlinePickerVisible" title="在线用户" width="420px">
      <div class="member-list">
        <div v-if="onlineUsers.length === 0" class="empty-tip">当前没有其他人在线</div>
        <div v-for="u in onlineUsers" :key="u.id" class="member-item">
          <el-avatar :size="36" :src="u.icon || ''">
            {{ (u.name || '友').slice(0, 1) }}
          </el-avatar>
          <span class="member-name">{{ u.name }}</span>
          <el-button size="small" type="primary" plain @click="openPrivateChat(u)">
            私聊
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>

  <!-- 消息右键菜单：fixed 定位，避开 .chat-page 的 overflow:hidden 裁剪；
       下面这层透明遮罩负责「点空白处关闭」 -->
  <div
    v-if="ctxMenu.visible"
    class="ctx-mask"
    @click="closeCtxMenu"
    @contextmenu.prevent="closeCtxMenu"
  ></div>
  <div
    v-if="ctxMenu.visible"
    class="msg-context-menu"
    :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
  >
    <div class="ctx-item" @click="handleRecall(ctxMenu.msg)">撤回</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import moment from 'moment'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getChatHistory,
  getChatSessions,
  getOnlineUsers,
  ackChat,
} from '@/api/chat'
import {
  connectChatSocket,
  closeChatSocket,
  onChat,
  offChat,
  sendChatFrame,
  sendAckFrame,
  sendRecallFrame,
  isChatSocketOpen,
} from '@/utils/chatSocket'
import { getUserInfo } from '@/utils/authToken'
import { useUserStore } from '@/store'

const MSG_TYPE = { PRIVATE: 1, GROUP: 2 }
const store = useUserStore()

// ---------- 状态 ----------
const myUserId = ref(null)
const sessions = ref([])          // 会话列表：群 + 私聊，含未读数
const activeSession = ref(null)   // 当前会话
const messages = ref([])          // 当前会话消息（时间正序）
const hasMoreHistory = ref(false)
const historyLoaded = ref(false)
const loadingHistory = ref(false)
const draft = ref('')
const connected = ref(false)
const onlineCount = ref(0)
const onlineUsers = ref([])        // 在线用户（带昵称头像，已排除自己）——私聊对象来源
const onlinePickerVisible = ref(false)
const bodyRef = ref(null)

// 未读数按会话 key（messageType:targetId）快速索引
const sessionKey = (s) => `${s.messageType}:${s.targetId}`

function isActive(session) {
  return (
    activeSession.value &&
    sessionKey(activeSession.value) === sessionKey(session)
  )
}

function formatTime(t) {
  // 完整时间：消息时间跨度可能跨天，只显示时分无法区分日期
  return moment(t).format('YYYY-MM-DD HH:mm:ss')
}

// ---------- 数据加载 ----------
async function loadSessions() {
  const res = await getChatSessions()
  if (res.code === 200) {
    // 后端全局把 Long 序列化成字符串（zw-common JsonConfig 的 ToStringSerializer，
    // 为防 JS 精度丢失），unreadCount 到手是 "0" 而非 0。字符串 "0" 是 truthy，
    // 会导致「没有未读却显示 0 角标」，且 ("0"+1) 会拼成 "01"。在数据入口统一转数字。
    sessions.value = (res.data || []).map((s) => ({
      ...s,
      unreadCount: Number(s.unreadCount) || 0,
    }))
    if (!activeSession.value && sessions.value.length > 0) {
      switchSession(sessions.value[0])
    }
  }
}

async function loadOnlineUsers() {
  const res = await getOnlineUsers()
  if (res.code === 200) {
    onlineUsers.value = res.data || []
    onlineCount.value = onlineUsers.value.length
  }
}

// ---------- 私聊 ----------
async function openOnlineUsers() {
  // 打开前先刷新一次，保证列表是「此刻在线」的
  await loadOnlineUsers()
  onlinePickerVisible.value = true
}

function openPrivateChat(member) {
  onlinePickerVisible.value = false
  const targetId = member.id
  // 已存在该私聊会话则直接切换，否则新建一个（不落库，纯前端会话项，
  // 发第一条消息后 offlineSessions 接口就会自然带上它）
  let session = sessions.value.find(
    (s) => s.messageType === MSG_TYPE.PRIVATE && s.targetId === targetId,
  )
  if (!session) {
    session = {
      messageType: MSG_TYPE.PRIVATE,
      targetId,
      targetName: member.name,
      targetIcon: member.icon,
      unreadCount: 0,
      lastAckedId: 0,
    }
    sessions.value.unshift(session)
  }
  switchSession(session)
}

// 拉当前会话历史；beforeId=0 取最新一页
async function loadHistory(beforeId = 0) {
  const s = activeSession.value
  if (!s) return []
  loadingHistory.value = true
  try {
    const res = await getChatHistory(s.messageType, s.targetId, beforeId)
    if (res.code !== 200) return []
    const list = res.data || []
    hasMoreHistory.value = list.length >= 30
    if (beforeId === 0) {
      messages.value = list
      historyLoaded.value = true
      await nextTick()
      scrollToBottom()
      // 首屏加载完成：把最后一条消息 ack 给服务端，未读清零（离线闭环的 ack）
      if (list.length > 0 && s.unreadCount > 0) {
        s.unreadCount = 0
        sendAckFrame(s.messageType, s.targetId, list[list.length - 1].id)
        if (!isChatSocketOpen()) {
          ackChat(s.messageType, s.targetId, list[list.length - 1].id)
        }
      }
    } else {
      // 翻更早：插到头部，并保持滚动位置不跳
      const body = bodyRef.value
      const oldHeight = body ? body.scrollHeight : 0
      messages.value = [...list, ...messages.value]
      await nextTick()
      if (body) body.scrollTop = body.scrollHeight - oldHeight
    }
    return list
  } finally {
    loadingHistory.value = false
  }
}

function loadMore() {
  if (messages.value.length === 0) return
  loadHistory(messages.value[0].id)
}

// ---------- 会话切换 / ack ----------
function switchSession(session) {
  if (isActive(session)) return
  closeCtxMenu()
  activeSession.value = session
  historyLoaded.value = false
  messages.value = []
  loadHistory(0)
}

// 已读确认：历史首屏加载完成时统一 ack（见 loadHistory），
// 收到当前会话新消息时也会即时 ack（见 onChatFrame）

// ---------- 发送 ----------
function handleSend() {
  const content = draft.value.trim()
  if (!content || !activeSession.value) return
  const s = activeSession.value
  const ok = sendChatFrame(s.messageType, s.targetId, content)
  if (!ok) {
    ElMessage.warning('连接已断开，正在重连，请稍后再试')
    connectChatSocket()
    return
  }
  draft.value = ''
  // 自己的消息不在本地回显：服务端会把消息（含雪花 ID 与过滤后的内容）
  // 推回给发送者自己的连接，保证列表里 ID、顺序与所有人看到的一致
}

// ---------- 撤回 ----------
const RECALL_WINDOW_MS = 2 * 60 * 1000

// 撤回按钮的显隐依赖「当前时间」：Vue 不会因为时间流逝而重渲染，
// 所以用一个 tick 驱动重算，否则消息过了 2 分钟后按钮不会自己消失。
const nowTick = ref(Date.now())
let nowTimer = null

function canRecall(msg) {
  if (!msg || msg.recalled || msg.senderId !== myUserId.value) return false
  return nowTick.value - moment(msg.sentAt).valueOf() < RECALL_WINDOW_MS
}

// ---------- 消息右键菜单 ----------
const ctxMenu = ref({ visible: false, x: 0, y: 0, msg: null })

function onMsgContextMenu(e, msg) {
  // 不能撤回的消息不拦默认右键菜单，浏览器自带的「复制」等还能用
  if (!canRecall(msg)) return
  e.preventDefault()
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, msg }
}

function closeCtxMenu() {
  ctxMenu.value.visible = false
}

async function handleRecall(msg) {
  closeCtxMenu()
  try {
    await ElMessageBox.confirm('撤回后对方将看不到这条消息，确定撤回？', '撤回消息', {
      confirmButtonText: '撤回',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    return // 点了取消
  }
  if (!sendRecallFrame(msg.id)) {
    ElMessage.warning('连接已断开，正在重连，请稍后再试')
    connectChatSocket()
  }
  // 不做本地乐观更新：等服务端回推 RECALL 帧，保证所有人看到的状态一致
}

// 收到撤回通知（别人撤回的，或自己在别的端撤回的）：把列表里那条标记为已撤回
function onRecallFrame(frame) {
  const s = { messageType: frame.messageType, targetId: frame.targetId }
  // 只处理当前打开的会话；其他会话里的那条，下次拉历史时自然带上 recalled
  if (!activeSession.value || sessionKey(activeSession.value) !== sessionKey(s)) {
    return
  }
  const target = messages.value.find((m) => String(m.id) === String(frame.id))
  if (target) {
    target.recalled = true
    target.content = ''
  }
}

// ---------- WS 事件 ----------
async function onChatFrame(frame) {
  const s = {
    messageType: frame.messageType,
    targetId: frame.targetId,
  }
  // 消息属于当前打开的会话：直接追加并 ack
  if (activeSession.value && sessionKey(activeSession.value) === sessionKey(s)) {
    messages.value.push(frame)
    await nextTick()
    scrollToBottom()
    sendAckFrame(frame.messageType, frame.targetId, frame.id)
    return
  }
  // 其他会话：只累加未读数
  const target = sessions.value.find((x) => sessionKey(x) === sessionKey(s))
  if (target) {
    target.unreadCount = Number(target.unreadCount || 0) + 1
  } else {
    // 新对端的私聊：补一条会话
    sessions.value.push({
      messageType: frame.messageType,
      targetId: frame.targetId,
      targetName: frame.messageType === 2 ? `群聊 ${frame.targetId}` : frame.senderName,
      targetIcon: frame.messageType === 2 ? null : frame.senderIcon,
      unreadCount: 1,
      lastAckedId: 0,
    })
  }
}

function onSocketOpen() {
  connected.value = true
  // 重连成功后拉一次会话数据：断线期间的消息按位点在 sessions 未读数中体现
  loadSessions()
  loadOnlineUsers()
}

function onSocketClose() {
  connected.value = false
}

function onSocketError() {
  connected.value = false
}

// ---------- 在线名单变化（服务端推的 PRESENCE 帧）----------
let presenceTimer = null

function onPresenceFrame() {
  // 有人上线/下线。500ms 内的多次变化合并成一次请求，
  // 避免「群里 30 多人陆续上线」时每个客户端被触发几十次刷新。
  if (presenceTimer) return
  presenceTimer = setTimeout(() => {
    presenceTimer = null
    loadOnlineUsers()
  }, 500)
}

// ---------- 用户资料变更（服务端推的 PROFILE_CHANGED 帧）----------
// 某人（可能是别人，也可能是自己在另一个标签页）换了昵称/头像。
// 服务端在推帧前已经失效过缓存并把**新资料**一并带下来了，所以这里纯本地替换，
// 不再发任何请求 —— 否则「一个在线客户端一次请求」会被放大成「在线人数」倍。
function onProfileChangedFrame(frame) {
  // 后端全局把 Long 序列化成字符串（zw-common JsonConfig 的 ToStringSerializer），
  // 这里统一 String() 后再比，避免 "2" === 2 这种坑（详见 loadSessions 里的同类注释）
  const uid = String(frame.userId ?? '')
  if (!uid) return
  const hasIcon = frame.icon !== undefined && frame.icon !== null
  const name = frame.name || ''

  // ① 当前会话里该用户的消息气泡：就地替换头像/昵称
  messages.value.forEach((m) => {
    if (String(m.senderId) !== uid) return
    if (hasIcon) m.senderIcon = frame.icon
    if (name) m.senderName = name
  })

  // ② 左侧会话列表：私聊对端的昵称头像（群聊 targetIcon 恒为空，不用管）
  sessions.value.forEach((s) => {
    if (s.messageType !== MSG_TYPE.PRIVATE || String(s.targetId) !== uid) return
    if (hasIcon) s.targetIcon = frame.icon
    if (name) s.targetName = name
  })

  // ③ 「在线用户」弹窗列表
  onlineUsers.value.forEach((u) => {
    if (String(u.id) !== uid) return
    if (hasIcon) u.icon = frame.icon
    if (name) u.name = name
  })

  // ④ 换的是自己：同步 store，让顶部 Header 的头像/昵称跟着变。
  //    同一个标签页里 mySet 保存时已经更新过 store，这一步是给「另一个标签页」兜底。
  if (String(myUserId.value) === uid) {
    const info = { ...store.getUserInfo }
    if (hasIcon) info.icon = frame.icon
    if (name) info.name = name
    store.setUserInfo(info)
  }
}

// ---------- 滚动 ----------
function scrollToBottom() {
  const body = bodyRef.value
  if (body) body.scrollTop = body.scrollHeight
}

function onScroll() {
  // 滚动时关掉右键菜单，否则菜单会停在原地跟内容脱节
  closeCtxMenu()
}

// ---------- 生命周期 ----------
onMounted(async () => {
  // 当前登录用户 ID 来自登录时写入的 userInfo
  try {
    const info = getUserInfo() || {}
    myUserId.value = info.id || null
  } catch (e) {
    myUserId.value = null
  }
  connected.value = isChatSocketOpen()
  onChat('CHAT', onChatFrame)
  onChat('RECALL', onRecallFrame)
  onChat('PRESENCE', onPresenceFrame)
  onChat('PROFILE_CHANGED', onProfileChangedFrame)
  onChat('OPEN', onSocketOpen)
  onChat('CLOSE', onSocketClose)
  onChat('ERROR', onSocketError)
  connectChatSocket()
  loadSessions()
  loadOnlineUsers()
  // 每 10s 重算一次「当前时间」，让撤回按钮在超出 2 分钟窗口后自动消失
  nowTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 10000)
})

onUnmounted(() => {
  offChat('CHAT', onChatFrame)
  offChat('RECALL', onRecallFrame)
  offChat('PRESENCE', onPresenceFrame)
  offChat('PROFILE_CHANGED', onProfileChangedFrame)
  offChat('OPEN', onSocketOpen)
  offChat('CLOSE', onSocketClose)
  offChat('ERROR', onSocketError)
  if (presenceTimer) {
    clearTimeout(presenceTimer)
    presenceTimer = null
  }
  if (nowTimer) {
    clearInterval(nowTimer)
    nowTimer = null
  }
  closeChatSocket()
})
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 120px);
  min-height: 480px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.member-list {
  max-height: 400px;
  overflow-y: auto;

  .member-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 6px;
    cursor: pointer;
    border-radius: 6px;

    &:hover {
      background: #f5f7fa;
    }

    .member-name {
      flex: 1;
      font-size: 14px;
      color: #333;
    }
  }

  .empty-tip {
    text-align: center;
    color: #bbb;
    padding: 20px 0;
  }
}

.chat-side {
  width: 260px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;

  .side-actions {
    padding: 0 16px 10px;
  }

  .side-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .side-title {
      font-size: 16px;
      font-weight: 600;
    }

    .online-tip {
      font-size: 12px;
      color: #52c41a;

      &.offline {
        color: #faad14;
      }
    }
  }

  .session-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;

    &:hover {
      background: #f7f8fa;
    }

    &.active {
      background: #ecf5ff;
    }

    .session-avatar {
      background: #4e83fd;
      color: #fff;
      font-weight: 600;
    }

    .session-info {
      .session-name {
        font-size: 14px;
        color: #333;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .session-desc {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .chat-header {
    padding: 14px 20px;
    font-size: 15px;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;

    .member-count {
      margin-left: 10px;
      font-size: 12px;
      font-weight: 400;
      color: #999;
    }
  }

  .chat-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;

    .load-more {
      text-align: center;
      font-size: 12px;
      color: #4e83fd;
      cursor: pointer;
      padding: 4px 0 12px;
    }

    .empty-tip {
      text-align: center;
      color: #bbb;
      font-size: 13px;
      padding-top: 40px;
    }

    .main-empty {
      padding-top: 30vh;
    }
  }

  .msg-row {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;

    &.mine {
      flex-direction: row-reverse;

      .msg-content {
        align-items: flex-end;

        .msg-bubble {
          background: #4e83fd;
          color: #fff;
        }
      }
    }

    .msg-content {
      display: flex;
      flex-direction: column;
      max-width: 60%;

      .msg-meta {
        font-size: 12px;
        color: #aaa;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;

        .meta-name {
          color: #666;
          font-weight: 500;
        }

        .meta-time {
          font-size: 11px;
          color: #bbb;
        }
      }

      .msg-recalled {
        font-size: 12px;
        color: #bbb;
        padding: 4px 0;
      }

      .msg-bubble {
        padding: 8px 12px;
        border-radius: 8px;
        background: #f4f5f7;
        color: #333;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
        white-space: pre-wrap;
      }
    }
  }

  .chat-input {
    padding: 12px 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
    align-items: flex-end;

    .el-button {
      height: 54px;
    }
  }
}

// 消息右键菜单（fixed 定位，所以写在与 .chat-page 同级的顶层）
.ctx-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.msg-context-menu {
  position: fixed;
  z-index: 2001;
  min-width: 88px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);

  .ctx-item {
    padding: 7px 16px;
    font-size: 13px;
    color: #333;
    cursor: pointer;

    &:hover {
      background: #f5f7fa;
    }
  }
}
</style>
