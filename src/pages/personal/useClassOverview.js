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
import { getMyPlan, getSignRecords, getTodayPoints } from '@/api/class.js'
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
  // 当月打卡数组（0/1，索引 0 = 1 号）：学习中心侧栏的打卡点阵用
  signData: [],
  signReady: false,
  // 本月连续打卡天数（从月末往前数连续的 1，跨月不续 —— 签到是按月 bitmap）
  streakDays: 0,
  // 今日已得积分（points-records/today 求和；无记录时接口返回 null 而不是空数组）
  todayPoints: null,
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
 * 本月连续打卡天数：从月末往前数连续的 1，遇到 0 停。
 * 跨月不续 —— 签到是 Redis 按月 bitmap，上月的连续与本月在数据上就不相连。
 */
function calcStreakDays(signData) {
  let streak = 0
  for (let i = signData.length - 1; i >= 0; i -= 1) {
    if (signData[i] === 1) streak += 1
    else break
  }
  return streak
}

/**
 * 非「我的课程」页的兜底：把顶部「本周目标 + 打卡 + 今日积分」要的数字补齐。
 *
 * 原来只有「我的课程」页会拉学习计划，概览卡因此被硬绑在那个页面上。
 * 但「本周计划 / 本周积分 / 打卡 / 今日积分」本来就是账号级数据，跟当前停在哪个子页无关。
 *
 * 请求很轻（计划只要 pageSize=1 的汇总字段），已有数据就跳过，
 * 避免从「我的课程」切过来时重复打接口。
 * plans / sign-records / points-records/today 这三个接口被顶部条和多个页面共用，
 * **只能从这里发一次**，组件里各自再拉就会出现「同屏两份请求两份答案」。
 */
export function ensureOverview() {
  if (overviewPending) return overviewPending
  // 同一天取过就跳过；跨天（页面开着过夜）则重拉，避免「本周计划」停在昨天
  if (state.weekReady && state.readyDate === todayKey()) return Promise.resolve()

  overviewPending = Promise.all([
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
    loadSignAndPoints(),
  ]).finally(() => {
    overviewPending = null
    // 课程数兜底：概览页的「在学 N 门」用得到；nowLesson 有 TTL + 并发合并，不会多打请求
    if (!state.courseCount) ensureCourseCount()
  })
  return overviewPending
}

/**
 * 打卡 + 今日积分这一对。
 *
 * 签到成功后必须重新拉这两份：签到了却还显示「今日 0 分 / 未打卡」，
 * 用户会以为签到没生效。所以单独抽出来给「签到」按钮复用。
 */
export function loadSignAndPoints() {
  return Promise.all([
    // 当月打卡：顶部点阵 + 连续天数（接口失败保持未就绪，显示「-」，不把整月画成未打卡）
    getSignRecords()
      .then((res) => {
        if (res.code == 200 && Array.isArray(res.data)) {
          state.signData = res.data
          state.signReady = true
          state.streakDays = calcStreakDays(res.data)
        }
      })
      .catch(() => {
        // 同上，装饰性数据
      }),
    // 今日已得积分：明细求和。⚠️ 无记录时接口返回 null 而不是空数组，必须判空
    getTodayPoints()
      .then((res) => {
        if (res.code == 200) {
          const records = res.data || []
          state.todayPoints = records.reduce((sum, r) => sum + (Number(r.points) || 0), 0)
        }
      })
      .catch(() => {
        // 拉不到就保持 null，显示「-」
      }),
  ])
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
