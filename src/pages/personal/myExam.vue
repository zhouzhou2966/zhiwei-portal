<!-- 我的考试（学习中心 · v2）
     数据：/es/exams/page（一次拉 100 条，前端分页 —— 统计头需要全量算均分/最高分）。
     练习和小节测验在课程学习页内完成，这里只做记录与复盘入口。 -->
<template>
  <div class="exWrap">
    <header class="exHead">
      <div>
        <h1>我的考试</h1>
        <p>
          共 <b>{{ total }}</b> 次考试记录 · 均分 <b>{{ avgScore == null ? '-' : avgScore }}</b>
          · 最近一次 {{ lastWhen }}
        </p>
      </div>
      <span class="exTip" @click="$router.push({ name: 'myClass' })">练习都在课程学习页里完成 →</span>
    </header>

    <div class="exKpis" v-if="status === 'ok' && list.length > 0">
      <div class="exKpi">
        <b>{{ total }}<em>次</em></b>
        <span>考试总数</span>
      </div>
      <div class="exKpi">
        <b>{{ avgScore == null ? '-' : avgScore }}<em>分</em></b>
        <span>平均分 · 及格线 60%</span>
      </div>
      <div class="exKpi">
        <b>{{ maxScore == null ? '-' : maxScore }}<em>分</em></b>
        <span>最高分{{ maxWhen ? ' · ' + maxWhen : '' }}</span>
      </div>
    </div>

    <!-- 列表走后端分页（一页 10 条）。切页时保留旧内容并变淡，
         不把整张表打回「正在加载」—— 记录再多翻页也不闪 -->
    <div class="exTable" :class="{ refreshing }" v-if="status === 'ok' && list.length > 0">
      <div class="exThead">
        <span>课程</span><span>考试小节</span><span>得分</span><span>正确率</span>
        <span>用时</span><span>交卷时间</span><span>操作</span>
      </div>
      <div class="exRow" v-for="it in list" :key="it.id" @click="openDetail(it)">
        <div class="cName"><i class="cDot"></i><span>{{ it.courseName || '课程' }}</span></div>
        <div class="cSec">{{ it.sectionName || '-' }}</div>
        <div class="cScore" :class="scoreClass(it.score, it.totalScore)">{{ it.score == null ? '-' : it.score }}</div>
        <div class="cRate">{{ rateText(it.correctRate) }}</div>
        <div class="cTime">{{ durationText(it.duration) }}</div>
        <div class="cWhen">{{ fmtWhen(it.finishTime || it.commitTime) }}</div>
        <div class="cOp">{{ it.score != null ? '看解析 →' : '继续答题 →' }}</div>
      </div>
      <div class="exPager" v-if="total > pageSize">
        <!-- 分页总数用后端返回的真实 total，不是已加载条数：
             原来一次拉 100 条再前端切，超过 100 次的记录永远翻不到 -->
        <el-pagination background layout="total, prev, pager, next" :total="total"
                       :page-size="pageSize" :current-page="pageNo"
                       @current-change="turnPage" />
      </div>
    </div>

    <div class="exEmpty" v-else-if="status === 'ok'">
      <p>还没有考试记录</p>
      <span>练习和小节测验在课程学习页里完成，做完自动出现在这里</span>
      <span class="exGo" @click="$router.push({ name: 'myClass' })">去我的课程 →</span>
    </div>
    <div class="exState" v-else-if="status === 'error'">
      <InlineError title="考试记录加载失败" :msg="errorMsg" @retry="load" />
    </div>
    <div class="exState" v-else>
      <span class="exLoadTip fadeInDelay">正在加载考试记录…</span>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getExamList, getExamStats } from '@/api/class.js'
import { errMsg, catchMsg } from '@/utils/request'
import { dayjs } from '@/utils/date'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
/** 当前页的记录（后端分页，一页 10 条） */
const list = ref([])
/** 全部记录数（后端给的真实 total，不是已加载条数） */
const total = ref(0)
/** 统计头：次数 / 均分 / 最高分，全部由后端按全量算 */
const stats = ref({ total: 0, avgScore: null, maxScore: null, maxWhen: '', lastWhen: '' })
const status = ref('loading')
/** 切页时保留旧表格并变淡，不打回「正在加载」 */
const refreshing = ref(false)
const errorMsg = ref('')
const pageNo = ref(1)
const pageSize = 10

/**
 * 统计头四个数字全部来自 /exams/stats。
 * 不能拿当前页凑数：列表一分页，均分会随翻页变大变小，用户翻两页就发现了。
 * 拉不到就显示 '-'，宁可空着也不给假数字。
 */
const avgScore = computed(() => stats.value.avgScore)
const maxScore = computed(() => stats.value.maxScore)
const maxWhen = computed(() => stats.value.maxWhen || '')
const lastWhen = computed(() => stats.value.lastWhen || '-')

const loadStats = async () => {
  try {
    const res = await getExamStats()
    if (res && res.code == 200 && res.data) stats.value = res.data
  } catch (e) {
    // 统计是附属信息，挂了不影响列表，保持 '-'
  }
}

const loadPage = async (silent = false) => {
  if (silent) refreshing.value = true
  else status.value = 'loading'
  try {
    const res = await getExamList({ pageNo: pageNo.value, pageSize })
    if (res.code == 200 && res.data) {
      list.value = res.data.list || []
      total.value = Number(res.data.total) || 0
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '考试记录加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '考试记录加载失败') || '请稍后重试'
    status.value = 'error'
  } finally {
    refreshing.value = false
  }
}

/** 首次进入 / 失败重试：统计和第一页一起拉 */
const load = () => {
  pageNo.value = 1
  loadStats()
  loadPage()
}
const turnPage = (p) => {
  pageNo.value = p
  loadPage(true)
}
onMounted(load)

/**
 * 及格线按「得分 ÷ 满分 ≥ 60%」判，不写死 ≥60 分：
 * 练习卷满分可能是 10 分，按绝对分判会把小分卷全染红。
 */
const scoreClass = (s, total) => {
  if (s == null) return ''
  const t = Number(total) || 0
  if (t <= 0) return ''
  return Number(s) / t >= 0.6 ? 'pass' : 'fail'
}
const durationText = (d) => {
  const sec = Number(d) || 0
  if (!sec) return '-'
  const m = Math.round(sec / 60)
  // 不足 1 分钟的显示「<1 分钟」—— 显示「0 分钟」等于说「没花时间」，是假信息
  if (m < 1) return '<1 分钟'
  return m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`
}
/**
 * 正确率：后端存的是**基点**（ExamRecordServiceImpl.RATE_SCALE = 10000，76% 存 7600），
 * 直接拼 % 会显示成 7600%（实测 10000%）。展示除以 100 并封顶 100。
 */
const rateText = (r) => {
  if (r == null) return '--'
  return Math.min(100, Math.round(Number(r) / 100)) + '%'
}
const fmtWhen = (t) => (t ? dayjs(t).format('M/D HH:mm') : '-')

const openDetail = (it) => {
  if (it.score == null) {
    // 没交卷的记录进详情页也看不到解析，直接回课程继续答题
    router.push({ path: '/learning/index', query: { id: it.courseId } })
    return
  }
  router.push({ name: 'myExamDetails', query: { id: it.id } })
}
</script>
<style lang="scss" scoped>
.exHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  h1 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -.4px;
    color: var(--ink);
  }
  p {
    margin-top: 7px;
    font-size: 13px;
    color: var(--ink3);
    b {
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 400;
      color: var(--ink);
    }
  }
}
.exTip {
  font-size: 12.5px;
  color: var(--ink3);
  cursor: pointer;
  &:hover {
    color: var(--main);
  }
}
.exKpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.exKpi {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  align-items: baseline;
  gap: 14px;
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 32px;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -1px;
    color: var(--ink);
    em {
      font-style: normal;
      font-family: var(--font-sans);
      font-size: 12.5px;
      color: var(--ink3);
      margin-left: 5px;
      letter-spacing: 0;
    }
  }
  span {
    font-size: 12.5px;
    color: var(--ink3);
  }
}
.exTable {
  margin-top: 22px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  transition: opacity .18s;
  /* 切页时整表变淡，等新数据到了再恢复：不插「正在加载」文字，也不会让表格高度跳一下 */
  &.refreshing {
    opacity: .45;
    pointer-events: none;
  }
}
.exThead,
.exRow {
  display: grid;
  grid-template-columns: 2.2fr 1.6fr .8fr .9fr .9fr 1fr .9fr;
  gap: 16px;
  align-items: center;
  padding: 0 24px;
}
.exThead {
  height: 48px;
  font-size: 12px;
  color: var(--ink3);
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}
.exRow {
  height: 66px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  cursor: pointer;
  transition: background-color .15s;
  &:last-of-type {
    border-bottom: none;
  }
  &:hover {
    background: #FDFCFA;
  }
}
.cName {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.cDot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--main-soft);
  flex: none;
}
.cSec {
  color: var(--ink2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cScore {
  font-family: var(--font-serif);
  font-variant-numeric: lining-nums;
  font-size: 19px;
  color: var(--ink);
  &.pass {
    color: var(--free);
  }
  &.fail {
    color: var(--color-error);
  }
}
.cRate,
.cTime,
.cWhen {
  color: var(--ink3);
  font-size: 12.5px;
}
.cOp {
  font-size: 12.5px;
  color: var(--main);
}
.exPager {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.exEmpty {
  margin-top: 22px;
  background: #fff;
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  padding: 70px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
  span {
    font-size: 12px;
    color: var(--ink3);
  }
}
.exGo {
  margin-top: 6px;
  height: 32px;
  padding: 0 18px;
  border-radius: 999px;
  background: var(--main);
  color: #fff !important;
  display: inline-flex;
  align-items: center;
  font-size: 12.5px;
  cursor: pointer;
}
.exState {
  margin-top: 22px;
  min-height: 260px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.exLoadTip {
  font-size: 13px;
  color: var(--ink3);
}
@media (max-width: 860px) {
  .exKpis {
    grid-template-columns: 1fr;
  }
}
</style>
