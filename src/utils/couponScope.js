/**
 * 券的使用范围展示。
 *
 * coupon_scope 只存三级分类 id（运营后台「指定课程分类」里选的那些），名称在本地用
 * /cs/categorys/all 的分类树映射 —— 一张券跨一次服务去查名字，列表里就会变成 N 次调用，
 * 而且分类树本身是低频变更数据，拉一次缓存整个会话足够。
 */
import { getClassCategorys } from '@/api/class'

// 模块级缓存：领券页、我的优惠券、翻卡浮层共用，切页面不再重复请求
let pending = null
let cacheMap = new Map()

function flatten(list, map) {
  if (!Array.isArray(list)) return
  list.forEach((item) => {
    if (!item) return
    if (item.id != null && item.name) map.set(String(item.id), item.name)
    flatten(item.children, map)
  })
}

/**
 * 加载分类树，返回 Promise<Map<string, string>>（id -> 名称）。
 *
 * 只有「真的拿到非空分类树」才写缓存。两种失败都要让 pending 失效，否则会永久错下去：
 *   ① 网络/HTTP 失败 —— axios reject；
 *   ② 网关回 code:0（课程服务没启动时返回「服务不存在」）—— 不 reject，但也不是成功。
 * 第二种最容易漏：它 resolve 成一个空 map，若照样缓存，整个会话都停在「2 个分类」，
 * 课服恢复了也不会重试，看起来就像前端把分类名写死了一样。
 */
export function loadCategoryMap() {
  if (pending) return pending
  pending = getClassCategorys()
    .then((res) => {
      if (!res || res.code !== 200 || !Array.isArray(res.data)) throw new Error('分类树不可用')
      const map = new Map()
      flatten(res.data, map)
      if (!map.size) throw new Error('分类树为空')
      cacheMap = map
      return map
    })
    .catch(() => {
      // 下次调用重试；本次先返回上一次成功的结果（可能为空），页面退化成「N 个分类」
      pending = null
      return cacheMap
    })
  return pending
}

/**
 * 适用范围文案。
 *
 * @param coupon 券对象（用到 specific、scopeCategoryIds）
 * @param map    分类 id -> 名称
 * @returns {string} 全部课程 / 分类名（最多两个，多出来的折成「等 N 个分类」）
 */
export function couponScopeText(coupon = {}, map = cacheMap) {
  // specific 可能是 null（老数据），只有明确 true 才算限定
  if (!Boolean(coupon.specific)) return '全部课程'
  const ids = Array.isArray(coupon.scopeCategoryIds) ? coupon.scopeCategoryIds : []
  if (!ids.length) return '指定分类课程'
  const names = ids.map((id) => map.get(String(id))).filter(Boolean)
  // 分类树没命中（id 停用 / 树里只下发部分节点）时只说数量。
  // 这里不能再带「指定」二字 —— 调用方已经拼了「仅限」，会变成「仅限 指定 2 个分类」。
  if (!names.length) return `${ids.length} 个分类`
  const picked = fitNames(names)
  const head = picked.join('、')
  // 名字没显示全（受宽度或 id 数限制）时都要报总数，
  // 否则「产品运营」会让人以为只限这一个分类。
  return picked.length < names.length || names.length < ids.length
    ? `${head} 等 ${ids.length} 个分类`
    : head
}

/**
 * 列表卡一行只能放下约 20 个字符（卡宽 ~430，扣掉价格区和按钮区）。
 * 两个名字加起来超过 9 个字就会被挤成两行 —— 而且断点正好落在「等 3 / 个分类」
 * 中间，比只显示一个名字还难读。所以按长度往里收，能放两个就放两个。
 *
 * 这个 9 是按当前卡片宽度和 13px 字号估的，不是精确排版值；
 * 卡片宽度改了要一起调。翻卡浮层的券面也用同一份判据 —— 宽度够，但两边文案
 * 保持一致更好，否则同一张券在列表和浮层里说两套话。
 */
const NAME_FIT = 9

function fitNames(names, max = 2) {
  let n = Math.min(max, names.length)
  while (n > 1 && names.slice(0, n).join('、').length > NAME_FIT) n -= 1
  return names.slice(0, n)
}
