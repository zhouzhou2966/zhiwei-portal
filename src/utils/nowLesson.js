/**
 * 「最近学习课程」的模块级共享状态（GET /ls/lessons/now）。
 *
 * 为什么要有这个模块：
 *   Header（学习中心下拉）和「我的课程」页都要这份数据，原来各发一次请求 ——
 *   进一次我的课程页就是 2 次 `/ls/lessons/now`（每次后面还带 2 次 Feign 调 course/user）。
 *   两个组件几乎同时挂载，天然适合合并成一次。
 *
 * 为什么不放 pinia：
 *   dataCacheStore 是开了 persist 的，把实时数据塞进去会被持久化，
 *   下次进页面先闪一眼上次的旧值，比多一次请求更糟（和 useClassOverview 的取舍一样）。
 *
 * 合并方式：
 *   ① inFlight —— 并发调用复用同一个 Promise，两个组件只会看到一次网络请求；
 *   ② TTL     —— SPA 里 Header 只挂载一次，页面来回切时用 TTL 控制新鲜度，
 *                5 秒内不重复打接口，超过就重拉，不至于长时间停在旧进度上；
 *   ③ force   —— 页面级调用（我的课程）传 true 绕过 TTL，但要刷新时仍需等 inFlight 结束。
 */
import { ref } from 'vue'
import { getMyLearning } from '@/api/class.js'

// 缓存有效期。真实用户切页远快于此，同时也不至于让「学完一节回来」看到旧进度
const TTL = 5000

const nowLesson = ref(null)
const loaded = ref(false)
const loading = ref(false)
let inFlight = null
let loadedAt = 0

/**
 * 让缓存失效（下次调用一定会重新请求）。
 * 不在这里清空 nowLesson：清空会让 Header 下拉在请求回来前消失一下，视觉上像闪了一下。
 * 需要「立刻重拉」的场景（学完一节回到我的课程、下单成功）直接传 force。
 */
export function invalidateNowLesson() {
  loaded.value = false
  loadedAt = 0
}

/**
 * 拉取「最近学习课程」。
 *
 * @param {boolean} force 忽略 TTL 强制刷新
 * @returns {Promise<{data: object|null, res: object|null, error: boolean}>}
 *   data  —— 成功时的数据（没有课表时是 null）
 *   res   —— 请求正常返回时的原始响应体，业务失败时调用方用它取 msg
 *   error —— true 表示网络层失败（catch），调用方据此给兜底文案
 */
export function loadNowLesson(force = false) {
  // 缓存命中：注意这里 res 是 null，调用方不能靠它判业务失败
  if (!force && loaded.value && Date.now() - loadedAt < TTL) {
    return Promise.resolve({ data: nowLesson.value, res: null, error: false })
  }
  if (inFlight) return inFlight

  loading.value = true
  inFlight = getMyLearning()
    .then((res) => {
      // 网关对「服务不存在」回的是 HTTP 200 + code:0，所以不能只判 res 存在
      nowLesson.value = res && res.code === 200 ? res.data : null
      loaded.value = true
      loadedAt = Date.now()
      return { data: nowLesson.value, res, error: false }
    })
    .catch(() => {
      nowLesson.value = null
      loaded.value = true
      loadedAt = Date.now()
      return { data: null, res: null, error: true }
    })
    .finally(() => {
      loading.value = false
      inFlight = null
    })
  return inFlight
}

export function useNowLesson() {
  return { nowLesson, loaded, loading }
}
