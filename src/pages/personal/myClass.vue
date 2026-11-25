<!-- 我的课程（学习中心 · 课程资产页 v2）
     只回答「我有哪些课、学到哪了」：筛选 + 搜索 + 排序 + 网格。
     计划的新建/修改仍在卡片上的计划按钮里（PlanDialog）。
     筛选状态落 URL query（?tab=finished），刷新/分享不丢。 -->
<template>
  <div class="mcWrap">
    <header class="mcHead">
      <div>
        <h1>我的课程</h1>
        <p>
          在学 <b>{{ learningCount }}</b> 门 · 未开始 <b>{{ notBeginCount }}</b> 门
          · 已学完 <b>{{ finishedCount }}</b> 门 · 共 <b>{{ learnedTotal }}</b> 节已学
        </p>
      </div>
      <div class="mcTools">
        <div class="mcSearch">
          <input v-model.trim="keyword" type="text" placeholder="搜索课程">
          <span v-if="keyword" class="mcClear" @click="keyword = ''">×</span>
        </div>
        <div class="mcSort" :class="{ open: sortOpen }">
          <!-- .stop 必须加：否则同一次点击冒泡到 document，被「点外部关闭」的逻辑当场关掉 -->
          <span class="mcSortLabel" @click.stop="sortOpen = !sortOpen">排序 · {{ sortLabelText }} <i class="caret"></i></span>
          <!-- 明确的下拉而不是「点一下轮换」：「最近学习 ↓」既没说排序，
              箭头又像数据方向，用户看不出这是可点的菜单 -->
          <div class="mcSortMenu" v-if="sortOpen" @click.stop>
            <div class="opt" :class="{ on: sort === 'recent' }" @click="pickSort('recent')">
              最近学习<i class="tick" v-if="sort === 'recent'"></i>
            </div>
            <div class="opt" :class="{ on: sort === 'expire' }" @click="pickSort('expire')">
              即将到期<i class="tick" v-if="sort === 'expire'"></i>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 到期提示：课程过期后不可再学、没学完的节也不计入进度，是这里唯一值得置顶的坏消息。
         只在真有课时才出现（大多数时候没有），不做常驻占位 -->
    <p class="mcExpireWarn" v-if="expiringList.length > 0">
      <span class="dot" aria-hidden="true"></span>
      {{ expiringList.length }} 门课将在 7 天内到期，过期后没学完的节不再计入进度：
      <em>{{ expiringNames }}</em>
    </p>

    <div class="mcTabs">
      <span class="mcTab" :class="{ on: tab === 'learning' }" @click="setTab('learning')">
        在学 <i>{{ learningCount }}</i>
      </span>
      <span class="mcTab" :class="{ on: tab === 'notbegin' }" @click="setTab('notbegin')">
        未开始 <i>{{ notBeginCount }}</i>
      </span>
      <span class="mcTab" :class="{ on: tab === 'finished' }" @click="setTab('finished')">
        已学完 <i>{{ finishedCount }}</i>
      </span>
      <span class="mcTab" :class="{ on: tab === 'expired' }" @click="setTab('expired')">
        已失效 <i>{{ expiredCount }}</i>
      </span>
      <span class="mcTotal">共 {{ totalCount }} 门</span>
    </div>

    <div class="mcGrid" v-if="lessonStatus === 'ok' && shownList.length > 0">
      <ClassGridCard v-for="item in shownList" :key="item.id" :data="item"
                     :show-tag="false"
                     @planHandle="onPlanHandle"></ClassGridCard>
    </div>
    <!-- 整个课表为空：引导去选课，不是错误 -->
    <div class="mcEmpty" v-else-if="lessonStatus === 'ok' && totalCount === 0">
      <p>还没有课程，去课程首页看看</p>
      <span class="mcGo" @click="$router.push('/search/index')">去选课 →</span>
    </div>
    <div class="mcEmpty" v-else-if="lessonStatus === 'ok'">
      <p>{{ keyword ? '没有匹配的课程' : '这个分类下还没有课程' }}</p>
    </div>
    <div class="mcState" v-else-if="lessonStatus === 'error'">
      <InlineError title="课程列表加载失败" :msg="lessonError" @retry="getMyLessonsData" />
    </div>
    <div class="mcState" v-else>
      <span class="mcTip fadeInDelay">正在加载…</span>
    </div>

    <PlanDialog v-model="dialogVisible" :mode="dialogMode" :lesson="dialogLesson"
                @saved="getMyLessonsData(true)" @deleted="getMyLessonsData(true)"></PlanDialog>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errMsg, catchMsg } from '@/utils/request'
import { getMylessons } from '@/api/class.js'
import ClassGridCard from './components/ClassGridCard.vue'
import PlanDialog from './components/PlanDialog.vue'
import InlineError from '@/components/InlineError.vue'

const route = useRoute()
const router = useRouter()

/** 筛选 tab（状态落 URL query，刷新/分享不丢） */
const validTabs = ['learning', 'notbegin', 'finished', 'expired']
const initTab = () => (validTabs.includes(route.query.tab) ? route.query.tab : 'learning')
const tab = ref(initTab())
const setTab = (t) => {
  tab.value = t
  router.replace({ query: { ...route.query, tab: t === 'learning' ? undefined : t } })
}
watch(() => route.query.tab, (v) => {
  const t = validTabs.includes(v) ? v : 'learning'
  if (t !== tab.value) tab.value = t
})

/** 搜索 + 排序（都在前端做：一次拉全量，上限 100） */
const keyword = ref('')
const sort = ref('recent') // recent | expire
const sortLabelText = computed(() => (sort.value === 'recent' ? '最近学习' : '即将到期'))
const sortOpen = ref(false)
const pickSort = (v) => {
  sort.value = v
  sortOpen.value = false
}
// 点面板外 / 按 Esc 关闭（小下拉不该只有「再点一次按钮」一条关闭路径）
const onDocClick = () => { sortOpen.value = false }
const onKeydown = (e) => { if (e.key === 'Escape') sortOpen.value = false }
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})

/** 课程列表 */
const allList = ref([])
const totalCount = ref(0)
const lessonStatus = ref('loading')
const lessonError = ref('')
const getMyLessonsData = async (silent = false) => {
  if (!silent) lessonStatus.value = 'loading'
  try {
    const res = await getMylessons({ pageNo: 1, pageSize: 100 })
    if (res && res.code == 200 && res.data != null) {
      allList.value = res.data.list || []
      totalCount.value = Number(res.data.total) || 0
      lessonStatus.value = 'ok'
      return
    }
    lessonError.value = errMsg(res, '课程列表加载失败')
    lessonStatus.value = 'error'
  } catch (err) {
    lessonError.value = catchMsg(err, '课程列表加载失败') || '请先登录后查看课程'
    lessonStatus.value = 'error'
  }
}
onMounted(getMyLessonsData)

// 0-未开始 1-学习中 2-已学完 3-已失效。「未开始」和「在学」分开两个 tab：
// 0 节进度但已缴费的课混在「在学」里，会让用户误以为开始学了
const learningCount = computed(() => allList.value.filter(it => Number(it.status) === 1).length)
const notBeginCount = computed(() => allList.value.filter(it => Number(it.status) === 0).length)
const finishedCount = computed(() => allList.value.filter(it => Number(it.status) === 2).length)
const expiredCount = computed(() => allList.value.filter(it => Number(it.status) === 3).length)

/**
 * 距到期还有几天（向上取整）。null = 没有到期时间（永久有效）或时间非法。
 * 口径与卡片上的「N 天后到期」共用，避免页头提示与卡片各算一套。
 */
const daysLeftOf = (t) => {
  if (!t) return null
  const end = new Date(t).getTime()
  if (Number.isNaN(end)) return null
  return Math.ceil((end - Date.now()) / 86400000)
}

/** 7 天内到期的课程（已失效的排除：它已经过期，不是「将要」）。
 *  按到期时间由近到远排 —— 提示条里的名单顺序也应该是最急的在前 */
const expiringList = computed(() => allList.value
  .filter((it) => {
    if (Number(it.status) === 3) return false
    const left = daysLeftOf(it.expireTime)
    return left !== null && left >= 0 && left <= 7
  })
  .sort((a, b) => daysLeftOf(a.expireTime) - daysLeftOf(b.expireTime)))
const expiringNames = computed(() => {
  const names = expiringList.value.map(c => c.courseName).filter(Boolean)
  return names.length > 3 ? `${names.slice(0, 3).join('、')} 等` : names.join('、')
})

// 「共 Z 节已学」：每门封顶后再求和（learnedSections 可能大于 sections）
const learnedTotal = computed(() => allList.value.reduce((sum, it) => {
  const total = Number(it.sections) || 0
  const learned = Number(it.learnedSections) || 0
  return sum + (total > 0 ? Math.min(learned, total) : learned)
}, 0))

const tabList = computed(() => {
  const st = Number
  if (tab.value === 'notbegin') return allList.value.filter(it => st(it.status) === 0)
  if (tab.value === 'finished') return allList.value.filter(it => st(it.status) === 2)
  if (tab.value === 'expired') return allList.value.filter(it => st(it.status) === 3)
  return allList.value.filter(it => st(it.status) === 1)
})

const shownList = computed(() => {
  let list = tabList.value
  const kw = keyword.value.toLowerCase()
  if (kw) {
    list = list.filter(it => String(it.courseName || '').toLowerCase().includes(kw))
  }
  if (sort.value === 'expire') {
    list = [...list].sort((a, b) => {
      // 永久有效（expireTime 为空）排最后，其余按到期时间升序
      const ea = a.expireTime ? new Date(a.expireTime).getTime() : Number.MAX_SAFE_INTEGER
      const eb = b.expireTime ? new Date(b.expireTime).getTime() : Number.MAX_SAFE_INTEGER
      return ea - eb
    })
  }
  return list
})

/** 计划弹窗（创建/修改/删除） */
const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogLesson = ref(null)
const onPlanHandle = ({ data, type }) => {
  dialogMode.value = type
  dialogLesson.value = data
  dialogVisible.value = true
}
</script>
<style lang="scss" scoped>
.mcHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
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
.mcTools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.mcSearch {
  position: relative;
  input {
    width: 240px;
    height: 38px;
    padding: 0 30px 0 14px;
    border: 1px solid var(--line);
    // 输入框 10px 圆角：搜索框也做全 pill 是「每个元素都是胶囊」的 AI 味信号
    border-radius: 10px;
    background: #FDFCFA;
    font-size: 13px;
    color: var(--ink);
    outline: none;
    &::placeholder {
      color: var(--ink3);
    }
    &:focus {
      border-color: var(--main);
      background: #fff;
    }
  }
}
.mcClear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: var(--ink3);
  cursor: pointer;
  line-height: 1;
}
.mcSort {
  position: relative;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink2);
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  &.open {
    border-color: var(--main);
  }
  &:hover {
    color: var(--main);
    border-color: var(--main);
  }
}
.mcSortLabel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  .caret {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid currentColor;
    opacity: .7;
  }
}
.mcSortMenu {
  position: absolute;
  right: 0;
  top: 44px;
  z-index: 20;
  min-width: 132px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 10px 26px rgba(26, 29, 33, .10);
  padding: 6px;
  .opt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 7px 10px;
    border-radius: 7px;
    font-size: 13px;
    color: var(--ink);
    white-space: nowrap;
    cursor: pointer;
    &:hover {
      background: var(--paper);
    }
    &.on {
      color: var(--main);
      font-weight: 600;
      background: var(--main-soft);
    }
    // 选中标记用勾，不用再写一行解释文字
    .tick {
      width: 10px;
      height: 6px;
      border-left: 1.6px solid currentColor;
      border-bottom: 1.6px solid currentColor;
      transform: rotate(-45deg) translateY(-1px);
    }
  }
}
.mcExpireWarn {
  margin: 0 0 14px;
  padding: 9px 14px;
  border-radius: 6px;
  background: #FCF6E8;
  border: 1px solid #F0E3C4;
  font-size: 12.5px;
  line-height: 20px;
  color: #8C6D1F;
  em {
    font-style: normal;
    font-weight: 500;
  }
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-warning);
    margin-right: 8px;
    vertical-align: 2px;
  }
}
.mcTabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}
.mcTab {
  height: 34px;
  padding: 0 16px;
  // 状态筛选 8px 圆角（圆角按控件高度给，不是一个尺寸全 pill）
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink2);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color .18s, color .18s;
  i {
    font-style: normal;
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--ink3);
  }
  &:hover {
    background: var(--paper);
  }
  &.on {
    background: var(--ink);
    color: #fff;
    i {
      color: rgba(255, 255, 255, .62);
    }
  }
}
.mcTotal {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--ink3);
}
.mcGrid {
  margin-top: 24px;
  display: grid;
  // 自适应列：内容区 ~800px 时排 3 列（原来 3 列在 1200 断点被压成 2 列，
  // 一屏只放得下 1 张卡、右边一大片空）
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}
.mcEmpty {
  margin-top: 24px;
  padding: 70px 24px;
  background: #fff;
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
}
.mcGo {
  height: 34px;
  padding: 0 20px;
  border-radius: 999px;
  background: var(--main);
  color: #fff;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.mcState {
  margin-top: 24px;
  min-height: 300px;
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
.mcTip {
  font-size: 13px;
  color: var(--ink3);
}
@media (max-width: 900px) {
  // 列数交给 auto-fill（minmax 230px）自己算，这里只处理页头
  .mcHead {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
