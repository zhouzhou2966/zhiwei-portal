import request from '@/utils/request'

/**
 * 群聊模块 REST 接口：发送/ack 走 WebSocket 帧，这里只放「请求-响应」型操作。
 */

// 我的群列表
export function getMyGroups() {
  return request.get('/sms/chats/groups')
}

// 历史消息：beforeId=0 从最新开始，返回时间正序
export function getChatHistory(messageType, targetId, beforeId = 0, size = 30) {
  return request.get('/sms/chats/history', {
    params: { messageType, targetId, beforeId, size },
  })
}

// 会话列表 + 未读数（离线消息补拉入口）
export function getChatSessions() {
  return request.get('/sms/chats/sessions')
}

// 在线用户列表（带昵称头像，已排除自己）——私聊对象的来源
export function getOnlineUsers() {
  return request.get('/sms/chats/online')
}

// 已读确认（REST 备用通道，正常走 WS ACK 帧）
export function ackChat(messageType, targetId, messageId) {
  return request.post('/sms/chats/ack', { messageType, targetId, messageId })
}
