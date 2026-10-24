import moment from 'moment'

/**
 * 学习时间显示：「今天 01:07 / 昨天 18:20 / 10-20 09:15」。
 *
 * 后端返回的是 LocalDateTime 序列化后的字符串（yyyy-MM-dd HH:mm:ss），
 * 直接铺在表格里太长，一行放不下还会把「操作」列挤出去。
 * 解析不了就返回空串，由调用方决定显示「—」，不要把原始串硬塞出去。
 */
export function formatLearnTime(value) {
  if (!value) return ''
  const t = moment(value)
  if (!t.isValid()) return ''
  const today = moment().startOf('day')
  if (t.isSame(today, 'day')) return '今天 ' + t.format('HH:mm')
  if (t.isSame(moment(today).subtract(1, 'day'), 'day')) return '昨天 ' + t.format('HH:mm')
  return t.format('MM-DD HH:mm')
}
