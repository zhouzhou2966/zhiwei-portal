import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

// ⚠️ ISO 星期（周一=1 … 周日=7）请用 `.isoWeekday()`，**不要用 `format('E')`**。
//    moment 的 'E' 是 ISO 星期，但 dayjs 根本没有 'E' 这个 token —— 装了 isoWeek 或
//    advancedFormat 之后 `format('E')` 依然只输出字面字符 "E"，`Number('E')` = NaN，
//    静默把依赖它的计算变成 undefined（personal/components/Calendar.vue 踩过）。
dayjs.extend(isoWeek)

/**
 * 统一时间解析入口。
 *
 * 后端 LocalDateTime 序列化成 `yyyy-MM-dd HH:mm:ss`（空格分隔）。dayjs 默认走
 * `new Date(string)`，Chrome/Firefox 宽容能认，**Safari 认不了空格分隔会返回 Invalid Date**
 * （moment 自带 ISO 解析器所以原来没这个问题）。这里统一换成 T 分隔的标准 ISO 8601，
 * 各浏览器行为一致，且不带时区后缀 = 按本地时间解析，与 moment 一致。
 *
 * @param {string|number|Date|null} value
 * @returns {dayjs.Dayjs}
 */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return dayjs(NaN)
  if (typeof value === 'string' && value.includes(' ') && !value.includes('T')) {
    return dayjs(value.replace(' ', 'T'))
  }
  return dayjs(value)
}

export { dayjs }
export default dayjs
