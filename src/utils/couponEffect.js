/**
 * 领券翻卡动效的环境与数据适配。
 *
 * 单独抽出来的原因：档位判断（系统偏好、设备能力）和券面数据映射都不该散在模板里，
 * 而且组件里要重复调用，放在 setup 中反复 matchMedia 也会拖慢首次渲染。
 */
import { parseDate } from './date'

/**
 * 系统是否开启「减少动态效果」。
 * 命中后整段动画跳过，直接给静态卡 —— 这是最容易被忽略的无障碍分支，
 * 但也是唯一一个用户主动表达「我不想看动画」的渠道。
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 低端机判定。
 * deviceMemory / hardwareConcurrency 只有 Chromium 系提供，Safari 上都是 undefined；
 * 这种情况按「不低端」处理 —— 宁可多播一段光环，也不要在能跑的设备上阉割动效。
 */
export function isLowEndDevice() {
  const mem = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  if (typeof mem === 'number' && mem > 0 && mem <= 2) return true
  if (typeof cores === 'number' && cores > 0 && cores <= 2) return true
  return false
}

/**
 * 券面面额。
 * 分支必须和列表页保持一致：2、5 走折扣，其余（1 每满减 / 3 无门槛 / 4 满减）走金额。
 * 后端 discountValue 存的是「分」和「折扣值×10」，这里统一换算，避免两处各写一遍除法。
 *
 * @returns {{ symbol: string, amount: string, unit: string }}
 */
export function couponFace(coupon = {}) {
  const type = Number(coupon.discountType)
  const value = Number(coupon.discountValue) || 0
  if (type === 2 || type === 5) {
    const rate = value / 10
    return { symbol: '', amount: Number.isInteger(rate) ? String(rate) : rate.toFixed(1), unit: '折' }
  }
  const yuan = value / 100
  return { symbol: '¥', amount: Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2), unit: '' }
}

/**
 * 券数据是否够渲染一张卡。
 * 名称和面额全空说明后端返回异常，此时不该弹一个空卡面，交给调用方回退旧提示。
 */
export function isCouponRenderable(coupon) {
  return !!coupon && (!!coupon.name || Number(coupon.discountValue) > 0)
}

const DAY_MS = 86400000

/**
 * 距券到期的天数（向上取整）；没有合法到期时间返回 null。
 *
 * 向上取整：今天 23:00 到期 → 0（今天到期）、明天 10:00 到期 → 1（1 天后到期），
 * 两种口径都能落到正确的整数上。
 * 卡片上的有效期文案和页面顶部的「即将到期」提示都走这一个函数 ——
 * 两处各写一遍必然会出现「卡片说 3 天后到期、顶部说 2 天」的分裂。
 */
export function couponDaysLeft(termEndTime) {
  const end = parseDate(termEndTime)
  if (!end.isValid()) return null
  return Math.ceil((end.valueOf() - Date.now()) / DAY_MS)
}

/** 是否落在「即将过期」窗口内（0~days 天）。已经过期的返回 false，不该再提示「快到期」 */
export function couponExpiringSoon(coupon, days = 7) {
  const left = couponDaysLeft(coupon && coupon.termEndTime)
  return left !== null && left >= 0 && left <= days
}

/** 券名里描述优惠条件的那一段：满199减50 / 满99元打8.5折 / 每满100元减10元，不超过50元 */
const CONDITION_RE =
  /(?:每\s*)?满\s*\d+(?:\.\d+)?\s*元?\s*(?:减|打)\s*\d+(?:\.\d+)?\s*(?:元|折)?(?:\s*[，,、]?\s*不超过\s*\d+(?:\.\d+)?\s*元)?/g

/** 名字里夹着的条件描述可能带分隔符，去掉后要顺手把悬空的分隔符一起收掉 */
const SEPARATOR_RE = /[\s·・|｜/／、,，:：]+/g
const EDGE_SEPARATOR_RE = /^[\s·・|｜/／、,，:：\-—]+|[\s·・|｜/／、,，:：\-—]+$/g

function numbersOf(text) {
  return (String(text || '').match(/\d+(?:\.\d+)?/g) || []).map(Number)
}

/**
 * 券名与规则去重。
 *
 * 背景：`name` 是运营手填的自由文本，`rule` 是前端按 discountType 自动拼出来的。
 * 运营很容易把条件也写进名字（「新人大礼包 · 满199减50」），于是券名说了两遍同一件事，
 * 而且紧挨着，读起来啰嗦。这里只处理「名字里嵌了和 rule 同义条件」这一种情况：
 *   1. 切出名字里的条件片段，数字与 rule 对得上才认（避免误删「教师节5折专场」这种主题名）
 *   2. 条件是名字的全部内容时，退化成按券类型起的中性名（满减券/折扣券/无门槛券）
 * 名称为空串也不至于渲染成空白卡。
 *
 * @returns {{ title: string, rule: string }}
 */
export function couponCopy(coupon = {}) {
  const name = String(coupon.name || '').trim()
  const rule = String(coupon.rule || '').trim()
  const type = Number(coupon.discountType)

  let title = name
  if (name && rule) {
    const ruleNums = new Set(numbersOf(rule))
    // 条件片段里的数字必须全部在 rule 里出现过，否则视为名称自带的卖点（如「3折专区」）
    const belongsToRule = (text) => {
      const nums = numbersOf(text)
      return nums.length > 0 && nums.every((n) => ruleNums.has(n))
    }

    title = name
      .split(/([·・|｜/／、,，])/)
      .map((part) => {
        if (/^[·・|｜/／、,，]$/.test(part)) return part
        // 只删「数字都能在 rule 里找到」的条件片段，主题名（如「教师节5折专场」）原样保留
        return part
          .replace(CONDITION_RE, (m) => (belongsToRule(m) ? '' : m))
          // 条件写在括号里时会留下空括号，一并清掉
          .replace(/[（(]\s*[)）]|[【[]\s*[】\]]/g, '')
          .replace(EDGE_SEPARATOR_RE, '')
          .trim()
      })
      .join('')
      .replace(SEPARATOR_RE, ' ')
      .replace(EDGE_SEPARATOR_RE, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (!title) {
    // 类型分支和 couponFace / formatRule 保持一致
    if (type === 2 || type === 5) title = '折扣券'
    else if (type === 3) title = '无门槛券'
    else if (type === 1) title = '满减券'
    else title = rule ? '满减券' : '优惠券'
  }

  return { title, rule }
}
