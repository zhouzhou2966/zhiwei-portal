/**
 * 个人中心「学习概览」的共享状态。
 *
 * 为什么单独拎一个模块而不是塞进 pinia：
 * ① 左侧导航和「我的课程」页是兄弟关系（<LeftNav/> 与 <router-view/> 同级），
 *    页面没法 provide/inject 给侧边栏，只能走模块级单例；
 * ② dataCacheStore 是开了 persist 的，把三个实时数字塞进去会被持久化，
 *    下次进个人中心先闪一眼上次的旧值，体验更差。
 */
import { reactive } from 'vue'
import { getMyPlan } from '@/api/class.js'
// 在学课程数改从「最近学习课程」拿：那个接口本来就要拉（Header / 我的课程页都在用），
// 而 /ls/lessons/page 的 total 含已失效课程，口径和 Header 的「N 门课程」对不上
import { loadNowLesson } from '@/utils/nowLesson'

const state = reactive({
  // 在学课程数（不含已失效）：侧边栏用户卡的「在学 N 门」和概览卡的第一行都用它
  courseCount: 0,
  // 课程数是否真的取到了。没取到时要显示「—」而不是 0 ——
  // 服务挂掉时给个 0 等于告诉用户「你没有课」，是编数据。
  courseReady: false,
  weekFinished: 0,
  weekPlan: 0,
  weekPoints: 0,
  // 三个数字是否齐了：没齐时概览卡显示「-」，不先摆 0 上去假装是真实值
  weekReady: false,
  // 取数当天（YYYY-M-D）。「本周计划/本周积分」是周口径，页面开着过夜后必须重拉，
  // 否则第二天还显示昨天/上周的数字。留空表示还没取过。
  readyDate: '',
})

// 跨天判定用的日期键，不引 moment（这里只需要年月日）
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

let countPending = null
let overviewPending = null

/**
 * 兜底拉一次课程数。
 *
 * 用户可能直接进「我的考试」等页面，那时「我的课程」页没跑过，
 * 用户卡上会显示 0 门。这里补一次。
 *
 * 走 nowLesson 模块而不是再打 `/ls/lessons/page?pageSize=1`：
 * ① 那个接口的 total 含已失效课程，和 Header「N 门课程」用的 courseAmount 口径不同；
 * ② nowLesson 有 5 秒 TTL + 并发合并，Header 刚拉过的数据这里直接复用，零额外请求。
 */
export function ensureCourseCount() {
  if (state.courseCount > 0 || countPending) return countPending
  countPending = loadNowLesson()
    .then(({ data }) => {
      if (data) {
        state.courseCount = Number(data.courseAmount) || 0
        state.courseReady = true
      }
    })
    .catch(() => {
      // 概览是装饰性信息，拉不到就留 0，不打扰用户
    })
    .finally(() => {
      countPending = null
    })
  return countPending
}

/**
 * 非「我的课程」页的兜底：把侧边栏「学习概览」要的数字补齐。
 *
 * 原来只有「我的课程」页会拉学习计划，概览卡因此被硬绑在那个页面上，
 * 切到「我的考试」侧边栏就只剩一张用户卡 + 5 个导航项，下半截全空。
 * 但「本周计划 / 本周积分 / 在学课程」本来就是账号级数据，跟当前停在哪个子页无关。
 *
 * 请求很轻（计划只要 pageSize=1 的汇总字段），已有数据就跳过，
 * 避免从「我的课程」切过来时重复打接口。
 */
export function ensureOverview() {
  if (overviewPending) return overviewPending
  // 同一天取过就跳过；跨天（页面开着过夜）则重拉，避免「本周计划」停在昨天
  if (state.weekReady && state.readyDate === todayKey()) return Promise.resolve()

  const jobs = [
    getMyPlan({ pageNo: 1, pageSize: 1 })
      .then((res) => {
        if (res.code == 200 && res.data != null) {
          setClassOverview({
            weekFinished: res.data.weekFinished || 0,
            weekPlan: res.data.weekTotalPlan || 0,
            weekPoints: res.data.weekPoints || 0,
          })
        }
      })
      .catch(() => {
        // 拉不到就保持「-」，不编数字
      }),
  ]

  if (!state.courseCount) jobs.push(ensureCourseCount())

  overviewPending = Promise.all(jobs).finally(() => {
    overviewPending = null
  })
  return overviewPending
}

// 「我的课程」页拉到完整数据后写入
export function setClassOverview({ courseCount, weekFinished, weekPlan, weekPoints }) {
  if (courseCount != null) {
    state.courseCount = courseCount
    state.courseReady = true
  }
  if (weekFinished != null) state.weekFinished = weekFinished
  if (weekPlan != null) state.weekPlan = weekPlan
  if (weekPoints != null) state.weekPoints = weekPoints
  state.weekReady = true
  state.readyDate = todayKey()
}

export function useClassOverview() {
  return state
}
