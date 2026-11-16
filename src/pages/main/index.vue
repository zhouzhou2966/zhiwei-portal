<!-- 首页 · v40 视觉稿
     结构：Hero（继续学习 + 今日一识）→ 01 专题 → 02 混排（筛选）→ 03 交流。
     数据逻辑沿用旧版：在学课程 / 本周计划 / 天梯榜 / 推荐课程 / 兴趣弹窗，
     任何一块接口失败都静默降级，不影响页面其它区块。 -->
<template>
  <div class="homeWrapper">
    <!-- Hero：浅蓝灰渐变带 -->
    <div class="heroband">
      <div class="container hero-in">
        <div class="continue">
          <div class="info">
            <div class="kicker">{{ heroKicker }}</div>
            <h1>{{ heroTitle }}</h1>
            <div class="next">{{ heroNext }}</div>
            <div class="bar"><i :style="{ width: heroPct + '%' }"></i></div>
            <div class="row">
              <span>{{ heroDone }}</span>
              <span>·</span>
              <span>{{ heroWeek }}</span>
              <span class="btn-cream" @click="goHero">继续学习</span>
            </div>
          </div>
          <div class="thumb" @click="goHero">
            <CourseCover :name="heroCourse" :category="heroCate" :src="heroCover" ratio="16/9" />
          </div>
        </div>

        <div class="glass">
          <span class="gtag">今日一识 · {{ today.tag }}</span>
          <h3>{{ today.title }}</h3>
          <p>{{ today.summary }}</p>
          <div class="gfoot">
            <span>90 秒读完 · {{ today.saves }}</span>
            <span class="sp">
              <span @click="nextCard">下一张 →</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 01 专题 -->
    <div class="container sec">
      <div class="sec-head">
        <div class="sec-l">
          <span class="idx">01</span>
          <div>
            <div class="sec-title">沿着一条线学下去</div>
            <div class="sec-sub">专题把课程和知识卡排成路径，不用自己拼</div>
          </div>
        </div>
        <span class="more" @click="router.push('/search/index')">看全部内容 →</span>
      </div>
      <div class="topics">
        <TopicCard v-for="t in TOPICS" :key="t.id" :topic="t" @open="goExplore" />
      </div>
    </div>

    <!-- 02 混排 -->
    <div class="container sec">
      <div class="sec-head">
        <div class="sec-l">
          <span class="idx">02</span>
          <div>
            <div class="sec-title">今天想学点什么</div>
            <div class="sec-sub">五个方向，长课和 90 秒知识混排，按你当下的兴趣挑</div>
          </div>
        </div>
        <span class="more" @click="router.push({ path: '/search/index', query: { tab: 'course' } })">看全部课程 →</span>
      </div>

      <div class="chips">
        <span
          class="chip"
          v-for="d in catChips"
          :key="d.key"
          :class="{ on: cat === d.key }"
          @click="selectCat(d.key)"
        >{{ d.label }}</span>
      </div>

      <!-- 数据未就绪时显示骨架屏，防止加载中途点筛选只看到知识卡 -->
      <div class="grid4" v-if="!mixReady">
        <div class="skel" v-for="i in 8" :key="i">
          <div class="skel-pic"></div>
          <div class="skel-l1"></div>
          <div class="skel-l2"></div>
        </div>
      </div>
      <template v-else>
        <div class="grid4">
          <template v-for="(item, i) in mixShown" :key="i">
            <CourseCard v-if="item.type === 'course'" :data="item.data" @open="goDetails" />
            <KnowledgeCard v-else :card="item.data" />
          </template>
        </div>
        <div class="mixEmpty" v-if="mixAll.length === 0">
        这个分类下暂时没有内容，看看别的分类吧
      </div>

        <div class="pager" v-if="mixPages > 1">
          <span class="nav" :class="{ dis: mixPage === 1 }" @click="turnMix(mixPage - 1)">上一页</span>
          <span v-for="p in mixPages" :key="p" class="pg" :class="{ on: p === mixPage }"
                @click="turnMix(p)">{{ p }}</span>
          <span class="nav" :class="{ dis: mixPage === mixPages }" @click="turnMix(mixPage + 1)">下一页</span>
        </div>
      </template>
    </div>

    <!-- 03 交流 -->
    <div class="container sec">
      <div class="sec-head">
        <div class="sec-l">
          <span class="idx">03</span>
          <div>
            <div class="sec-title">别人在想什么</div>
            <div class="sec-sub">问答、笔记、经验，都是学习的一部分</div>
          </div>
        </div>
        <span class="more" @click="goChat">进入交流区 →</span>
      </div>

      <div class="split">
        <div class="card feed">
          <div class="post" v-for="(p, i) in FEED_POSTS" :key="i" @click="goChat">
            <div class="av">{{ p.av }}</div>
            <div>
              <div class="t">{{ p.title }}</div>
              <div class="m">
                <span>{{ p.tag }}</span>
                <span>{{ p.replies }} 条回复</span>
                <b v-if="p.badge">{{ p.badge }}</b>
              </div>
            </div>
          </div>
        </div>

        <StatCard
          :logged="logged"
          :week="week"
          :rank="rank"
          @login="router.push('/login')"
        />
      </div>
    </div>

    <!-- 兴趣选择设置：首次登录且没设置过兴趣时自动弹出 -->
    <el-dialog v-model="interestDialog" width="80%" :show-close="false">
      <template #header="{ close }">
        <div class="dialogHead">
          <div>
            <span class="titleClass">设置学习兴趣</span>
            <span class="ft-cl-des dialogSub">打造你的专属在线学习平台</span>
          </div>
          <div class="butCont">
            <span class="bt-grey" @click="close">下次再选</span>
            <span class="bt" @click="saveInterest">保存</span>
          </div>
        </div>
      </template>
      <CheckInterest :data="classCategorys" :initValue="interest" @setInterestList="setInterestList" />
    </el-dialog>

    <!-- 右下角浮动优惠券礼包入口（可拖动）。

         这个入口是旧版首页（.mainWrapper 那版）就有的，v40 视觉稿重做首页时
         只换了模板和样式作用域，忘了把这个 DOM 一起搬过来 —— 结果首页再没有任何
         通往领券页的路径（Header 里也没有），只剩一张零引用的 coup.png 和
         index.scss 里一段没人用的 .floatCont（那段已随本次改动删掉）。

         默认位置仍是旧版的 right 16 / bottom 20vh / 110×110，但改成可拖：
         固定贴在右下、垂直 80% 处，正好压在右栏 SideRail（轮播/本周学习/天梯榜/话题）
         上，窄屏必然重叠。让用户自己挪开，比反复调一个对所有人都对的坐标更实在。
         拖动逻辑与「为什么松手要吸附左右边缘」见 script 里 giftFloat 那一段。

         角标读 loadTodo() 本来就拉好的 couponCount（那份数据算出来一直是死的）；
         0 张时不渲染角标，避免把「没券」做成又一个要看的红点。

         图片是「有券才动」：coup.png 其实是 APNG（37 帧 / 3.7s 一轮 / 无限循环），
         coup-static.png 是它首帧导出的静图（15KB，原图的 4%）。没券只用静图，
         原因和切换方式见 script 里 giftImgSrc 那一段。 -->
    <button
      type="button"
      class="giftFloat"
      :class="{ 'is-dragging': giftDragging }"
      :style="giftStyle"
      :aria-label="couponNum ? `优惠券礼包，${couponNum} 张可领` : '优惠券礼包'"
      @pointerdown="onGiftDown"
      @pointermove="onGiftMove"
      @pointerup="onGiftUp"
      @pointercancel="onGiftUp"
      @click="onGiftClick"
    >
      <img :src="giftImgSrc" alt="" draggable="false" />
      <span v-if="couponNum" class="giftBadge">{{ couponNum }}</span>
    </button>
  </div>
</template>
<script setup>
// errMsg / catchMsg：业务失败时响应体没有 data 字段，不能读 res.data.msg（见 utils/request.js）
import { catchMsg, errMsg } from '@/utils/request'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { dataCacheStore, isLogin, useUserStore } from '@/store'
import {
  classSeach,
  getClassCategorys,
  getCollectableCoupon,
  getExamList,
  getInterests,
  getMyPlan,
  getRecommendClassList,
  getSeasons,
  getSignRecords,
  pointsSign,
  setInterests
} from '@/api/class.js'
import { loadNowLesson } from '@/utils/nowLesson'
import { getClassDetails } from '@/api/classDetails.js'
import CourseCover from '@/components/ui/CourseCover.vue'
import CourseCard from '@/components/ui/CourseCard.vue'
import KnowledgeCard from '@/components/ui/KnowledgeCard.vue'
import TopicCard from '@/components/ui/TopicCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import CheckInterest from './components/CheckInterest.vue'
import { KNOWLEDGE_CARDS, dailyCard } from '@/mock/knowledge'
import { TOPICS, FEED_POSTS, DEMO_BOARD } from '@/mock/topics'
// 右下角浮动优惠券礼包图（旧版首页就在用，v40 重做时 DOM 丢了、图成了零引用）
// coupAnimated 是 APNG（37 帧循环），coupStatic 是它首帧导出的静图。
// 两个文件同画布 360×360、内容包围盒完全一致，所以 .giftFloat img 的定位参数对两者通用。
import coupAnimated from '@/assets/coup.png'
import coupStatic from '@/assets/coup-static.png'
import { prefersReducedMotion } from '@/utils/couponEffect'

const dataCache = dataCacheStore()
const userStore = useUserStore()
const router = useRouter()

const logged = ref(false)

// 分类（兴趣弹窗用）
const classCategorys = ref([])

// 在学课程（/ls/lessons/now）
const lesson = ref(null)
// 本周学习（积分近似时长：签到积分 / 学习完成节）
const week = reactive({ ready: false, done: 0, total: 0, points: 0 })
// 天梯榜
const rank = reactive({ list: [], myRank: 0, myPoints: 0 })
// 签到状态（数据存着，TaskDock 回归时直接用）
const signed = ref(false)
const signing = ref(false)
// 游客 Hero 兜底：拿第一门免费课当推荐位
const heroFallback = computed(() => freeClassData.value[0] || goodClassData.value[0] || newClassData.value[0] || null)

// 课程数据（推荐接口三种口径 + 全量列表）
const freeClassData = ref([])
const goodClassData = ref([])
const newClassData = ref([])
// 全量课程：混排区「IT·互联网」筛选下要能看到库里全部课程
const allCourses = ref([])
// 混排区数据是否就绪（课程接口全部落定后才渲染网格，防止半截数据先出来）
const mixReady = ref(false)

// 兴趣弹窗
const interestDialog = ref(false)
const interest = ref(new Set())
const interestCatch = ref(new Set())

/* ========== Hero ========== */
const heroCate = computed(() => (lesson.value && lesson.value.categoryName) || '免费课')
const heroCourse = computed(() => (lesson.value && lesson.value.courseName) || heroFallback.value?.name || '知微 · 学习平台')
const heroCover = computed(() => (lesson.value && lesson.value.coverUrl) || heroFallback.value?.coverUrl || '')
const heroPct = computed(() => {
  const total = Number(lesson.value && lesson.value.sections) || 0
  const learned = Number(lesson.value && lesson.value.learnedSections) || 0
  if (total <= 0) return 8
  return Math.max(4, Math.min(100, Math.round((learned * 100) / total)))
})
const heroDone = computed(() => {
  if (lesson.value && lesson.value.sections) return `已完成 ${lesson.value.learnedSections || 0} / ${lesson.value.sections} 节`
  return '未开始学习'
})
const heroWeek = computed(() => {
  if (!week.ready) return '本周累计待同步'
  return `本周积分 ${week.points}`
})
const heroKicker = computed(() =>
  logged.value ? '继续学习' : '今日推荐'
)
const heroTitle = computed(() => heroCourse.value)
const heroNext = computed(() => {
  if (lesson.value && lesson.value.latestSectionName) {
    return `下一节　${lesson.value.latestSectionName}`
  }
  if (heroFallback.value) return heroFallback.value.name
  return '从一门免费课开始，或者去探索页随便看看'
})
const goHero = () => {
  if (logged.value && lesson.value && lesson.value.courseId) {
    router.push({ path: '/learning/index', query: { id: lesson.value.courseId } })
    return
  }
  if (heroFallback.value) {
    router.push({ path: '/details/index', query: { id: heroFallback.value.id } })
    return
  }
  router.push('/search/index')
}

/* ========== 今日一识 ========== */
const cardIdx = ref(0)
const today = computed(() => {
  const base = dailyCard()
  const list = [base, ...KNOWLEDGE_CARDS.filter((x) => x.id !== base.id)]
  return list[cardIdx.value % list.length]
})
const nextCard = () => { cardIdx.value++ }

/* ========== 02 混排 ========== */
const cat = ref('all')
const catChips = [
  { key: 'all', label: '全部' },
  { key: 'it', label: 'IT·互联网' },
  { key: 'kcard', label: '知识卡' },
  { key: 'free', label: '免费' },
  { key: 'design', label: '设计·创作' },
  { key: 'hobby', label: '兴趣·生活' },
  { key: 'work', label: '职场·效率' },
  { key: 'life', label: '生活·自我管理' }
]

// 切分类 = 只看该分类的数据
const selectCat = (key) => {
  cat.value = key
}

// 混排池：推荐课排前面 + 全量课程补齐（领域按真实分类映射）。
// 知识卡按领域配额进池（每领域 4 张），避免某个领域卡片把其它筛选刷空
const KCARD_QUOTA = 4
const mixItems = computed(() => {
  const seen = new Set()
  const courses = []
  for (const list of [freeClassData.value, goodClassData.value, newClassData.value, allCourses.value]) {
    for (const it of list) {
      if (!it || seen.has(it.id)) continue
      seen.add(it.id)
      courses.push({
        type: 'course',
        data: it,
        domain: domainOf(it),
        free: Number(it.price) === 0,
        dur: 0,
        trial: false
      })
    }
  }
  const quota = {}
  const cards = []
  for (const c of KNOWLEDGE_CARDS) {
    quota[c.domain] = (quota[c.domain] || 0) + 1
    if (quota[c.domain] <= KCARD_QUOTA) {
      cards.push({ type: 'kcard', data: c, domain: c.domain, free: true, dur: 3, trial: true })
    }
  }
  // 交错：课、卡、课、卡……课用完剩下的全是卡
  const out = []
  let ci = 0
  let ki = 0
  while (ci < courses.length || ki < cards.length) {
    if (ci < courses.length) out.push(courses[ci++])
    if (ki < cards.length) out.push(cards[ki++])
  }
  return out
})

// 知识卡全量：「知识卡」单独 tab 用全部 45 张，不受混排配额限制
const kcardAll = KNOWLEDGE_CARDS.map((c) => ({
  type: 'kcard', data: c, domain: c.domain, free: true, dur: 3, trial: true
}))

// 筛选：点哪栏看哪栏（课程排前、知识卡排后；kcard 单独一类用全量；免费只看 0 元课）
const mixAll = computed(() => {
  if (cat.value === 'kcard') return kcardAll
  if (cat.value === 'free') {
    return mixItems.value.filter((x) => x.type === 'course' && x.free)
  }
  const list = mixItems.value.filter((x) =>
    cat.value === 'all' ? true : x.domain === cat.value
  )
  return [...list.filter((x) => x.type === 'course'), ...list.filter((x) => x.type === 'kcard')]
})

// 分页：4 列 × 2 行 = 8 / 页，筛选变化回到第 1 页
const MIX_PAGE_SIZE = 8
const mixPage = ref(1)
const mixPages = computed(() => Math.max(1, Math.ceil(mixAll.value.length / MIX_PAGE_SIZE)))
const mixShown = computed(() =>
  mixAll.value.slice((mixPage.value - 1) * MIX_PAGE_SIZE, mixPage.value * MIX_PAGE_SIZE)
)

const turnMix = (p) => {
  if (p < 1 || p > mixPages.value || p === mixPage.value) return
  mixPage.value = p
  document.querySelector('.grid4')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(cat, () => {
  mixPage.value = 1
})

const goDetails = (data) => {
  router.push({ path: '/details/index', query: { id: data.id } })
}
const goExplore = () => {
  router.push('/search/index')
}
const goChat = () => {
  if (logged.value) {
    router.push('/main/chat')
  } else {
    router.push('/login')
  }
}

onMounted(async () => {
  // 分类与推荐课程对游客也要有，先发（静默：首页任何一块失败都不该糊 toast）
  getClassCategoryData()
  // 课程数据并行拉取（推荐三种口径 + 全量），全部落定后才放开混排区渲染，
  // 避免用户在加载中途点筛选时只看到知识卡的半截数据
  const [free, good, nw, all] = await Promise.allSettled([
    fetchRecommend('free'),
    fetchRecommend('best'),
    fetchRecommend('new'),
    loadAllCourses()
  ])
  freeClassData.value = free.status === 'fulfilled' ? free.value : []
  goodClassData.value = good.status === 'fulfilled' ? good.value : []
  newClassData.value = nw.status === 'fulfilled' ? nw.value : []
  // 推荐课与全量课是同一批课：用全量接口补拉的分类信息回填推荐课，
  // 保证同一门课无论从哪个入口进混排池，领域归属都一致
  const byId = new Map(allCourses.value.map((it) => [String(it.id), it]))
  for (const arr of [freeClassData.value, goodClassData.value, newClassData.value]) {
    for (const it of arr) {
      const full = byId.get(String(it.id))
      if (full && full.cateNames) {
        it.cateNames = full.cateNames
        it.categoryName = full.categoryName
      }
    }
  }
  mixReady.value = true

  logged.value = await isLogin()
  if (!logged.value) return

  loadLesson()
  loadWeekPlan()
  loadRank()
  loadTodo()
  getInterestData()
})

/** 分类 **/
const getClassCategoryData = async () => {
  try {
    const res = await getClassCategorys()
    if (res.code === 200) {
      classCategorys.value = res.data
      dataCache.setCourseClassDataes(res.data)
    }
  } catch {
    /* 静默 */
  }
}

/** 推荐课程：三种口径复用同一个接口，只是 type 不同 **/
const fetchRecommend = async (type) => {
  try {
    const res = await getRecommendClassList(type)
    if (res.code === 200) return Array.isArray(res.data) ? res.data : []
  } catch {
    /* 静默降级：少一块课程不致命 */
  }
  return []
}

/** 全量课程：混排区筛选时展示库内所有课（推荐课已排前）
 *  门户搜索接口不带分类，逐门补拉详情拿 cateNames：
 *  ① categoryName 给课程卡封面角标用（二级分类名）
 *  ② 一级分类映射到混排筛选的领域键（吉他课 → 兴趣·生活，不再混进 IT） **/
const CATE_DOMAIN = [
  ['设计', 'design'],
  ['兴趣', 'hobby'],
  ['职场', 'work'],
  ['生活', 'life'],
  ['IT', 'it']
]
const domainOf = (it) => {
  const first = (it.cateNames || '').split('/')[0] || ''
  const hit = CATE_DOMAIN.find(([k]) => first.includes(k))
  return hit ? hit[1] : 'it'
}
const loadAllCourses = async () => {
  try {
    const res = await classSeach({ pageNo: 1, pageSize: 50 })
    if (res.code == 200) {
      const list = res.data.list || []
      // 详情接口互相独立，并行拉；单门失败只丢角标不影响整页
      await Promise.allSettled(
        list.map((it) =>
          getClassDetails(it.id)
            .then((r) => {
              if (r.code === 200 && r.data) {
                const seg = (r.data.cateNames || '').split('/').filter(Boolean)
                it.cateNames = r.data.cateNames || ''
                it.categoryName = seg[1] || seg[0] || ''
              }
            })
            .catch(() => {})
        )
      )
      allCourses.value = list
    }
  } catch {
    /* 静默：拿不到就用推荐课兜底 */
  }
}

/** 继续学习 **/
const loadLesson = () => {
  loadNowLesson()
    .then(({ data }) => {
      lesson.value = data
    })
    .catch(() => {})
}

/** 本周计划 **/
const loadWeekPlan = () => {
  getMyPlan({ pageNo: 1, pageSize: 1 })
    .then((res) => {
      if (res.code == 200 && res.data != null) {
        week.done = Number(res.data.weekFinished) || 0
        week.total = Number(res.data.weekTotalPlan) || 0
        week.points = Number(res.data.weekPoints) || 0
        week.ready = true
      }
    })
    .catch(() => {})
}

/** 天梯榜：真实数据回来覆盖 DEMO_BOARD（见 mock/topics.js） **/
const loadRank = () => {
  getSeasons({ season: 0, pageNo: 1, pageSize: 10 })
    .then((res) => {
      if (res.code == 200 && res.data) {
        const list = Array.isArray(res.data.boardList) ? res.data.boardList : []
        rank.list = list.length ? list : DEMO_BOARD
        rank.myRank = Number(res.data.rank) || 0
        rank.myPoints = Number(res.data.points) || 0
      }
    })
    .catch(() => {
      rank.list = DEMO_BOARD
    })
}

/** 待办：签到 / 考试 / 优惠券（数据存着，后续 TaskDock 回归时直接用） **/
const todo = reactive({ couponCount: 0, examCount: 0 })
// 角标只认 couponCount；接口失败或未登录时保持 0，角标不渲染（见模板注释）
const couponNum = computed(() => Number(todo.couponCount) || 0)
const loadTodo = () => {
  getSignRecords()
    .then((res) => {
      if (res && res.code == 200) {
        const arr = Array.isArray(res.data) ? res.data : []
        signed.value = Number(arr[new Date().getDate() - 1]) === 1
      }
    })
    .catch(() => {})

  getExamList({ pageNo: 1, pageSize: 1 })
    .then((res) => {
      if (res && res.code == 200 && res.data) {
        todo.examCount = Number(res.data.total) || 0
      }
    })
    .catch(() => {})

  getCollectableCoupon()
    .then((res) => {
      if (res && res.code == 200) {
        const list = Array.isArray(res.data) ? res.data : []
        todo.couponCount = list.filter((c) => c.available && !c.received).length
      }
    })
    .catch(() => {})
}

/* ===== 礼包图：有券才播动画 =====
 *
 * coup.png 不是静态图，是 APNG：37 帧 × 100ms、3.7 秒一轮、无限循环。
 * 一直在播有两个问题，都不是审美偏好：
 *
 *  1. **它绕过了 prefers-reduced-motion。** APNG 一加载就自己播，CSS 的
 *     @media (prefers-reduced-motion: reduce) 管不到图片内部的帧 —— 翻卡浮层那边
 *     是认真做了双端对齐的（CSS 停动效 + JS 跳过 count-up），首页这个永不停歇的
 *     循环恰好是漏掉的那一处。对开了「减少动态效果」的用户，这是个一直在转的东西。
 *
 *  2. **常驻播放会让「有券」这个信号失效。** 永远在动的东西，看过两三次就会被学会忽略；
 *     真正承载信息的是角标数字。动画应该只在「确实有东西可领」时承担召唤作用。
 *
 * 所以：没券 → 只显示首帧静图（15KB，APNG 的 4%）；有券 → 换成 APNG。
 * 切换是无缝的 —— 静图就是 APNG 的首帧（合上的礼盒），换 src 的视觉结果只是
 * 「合着的礼盒开始动」，不会跳帧。
 *
 * 顺带省流量：APNG 只在真的有券之后才下载。没券的用户始终只下 15KB。
 */
const giftAnimated = ref(false) // APNG 是否已加载完成
let giftLoader = null

function loadGiftAnimation() {
  // 只尝试一次。失败（断网/图片 404）就永远停在静图 ——
  // 不重试，因为这里不是关键资源，重试只会在弱网下反复抢带宽。
  if (giftAnimated.value || giftLoader) return
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    giftAnimated.value = true
    giftLoader = null
  }
  img.onerror = () => {
    giftLoader = null
  }
  img.src = coupAnimated
  giftLoader = img
}

// 首页是常驻页面（用户可能开着不动很久），所以 reduced-motion 不能只读一次，
// 要跟随系统设置的实时变化。这里复用翻卡浮层那份实现，避免两处判据飘。
const giftMql = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null
const giftStill = ref(!!giftMql && giftMql.matches)
const onGiftMotionChange = () => {
  giftStill.value = !!giftMql && giftMql.matches
}

const giftImgSrc = computed(() => (
  couponNum.value > 0 && giftAnimated.value && !giftStill.value ? coupAnimated : coupStatic
))

// immediate：覆盖「首屏就已知道有券」的情况（loadTodo 可能早于 watcher 注册完成）
watch(couponNum, (n) => {
  if (n > 0) loadGiftAnimation()
}, { immediate: true })

/* ===== 右下角礼包入口：可拖动 =====
 *
 * 为什么允许拖：这个球固定贴在右下、垂直 80% 处，而首页右栏有一整条 SideRail
 * （轮播 / 本周学习 / 天梯榜 / 话题，sticky 320px）。窄一点的屏上两者必然重叠，
 * 一个固定坐标不可能对所有人都合适。让用户自己挪开更实在。
 *
 * 为什么松手要吸附到左右边缘，而不是真的「停在任意位置」：
 *  1. 110px 的球停在正文中间会压住课程卡标题 —— 这次是他自己拖的，
 *     但位置要持久化，下次打开他早忘了，只会觉得「这产品怎么有个球挡字」；
 *  2. 吸附后**垂直方向完全自由**，「拖到不挡我的高度」这个真实诉求一点没被限制；
 *  3. 持久化必须存一个稳定、可复现的状态，不能存「x=647」这种换屏幕就错乱的绝对坐标
 *     （所以存的是 side + 垂直比例，见 saveGiftPref）。
 * 真要做成完全自由，删掉 snapGift() 里那行 x 赋值即可，其余不用动。
 */
const GIFT_SIZE = 110
const GIFT_EDGE = 16
const GIFT_POS_KEY = 'zw:gift-pos'

const clampNum = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi))
/** 垂直可用行程：去掉上下各 GIFT_EDGE 的边距 */
const giftTravelY = () => Math.max(0, window.innerHeight - GIFT_SIZE - GIFT_EDGE * 2)
const giftMaxX = () => Math.max(GIFT_EDGE, window.innerWidth - GIFT_SIZE - GIFT_EDGE)

function readGiftPref() {
  try {
    const raw = window.localStorage.getItem(GIFT_POS_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if ((o.side === 'left' || o.side === 'right') && Number.isFinite(o.ratio)) return o
  } catch (e) {
    /* 隐私模式 / 脏数据：当没存过，退回默认位置 */
  }
  return null
}

function saveGiftPref() {
  try {
    const travel = giftTravelY()
    window.localStorage.setItem(
      GIFT_POS_KEY,
      JSON.stringify({
        side: giftPos.x + GIFT_SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right',
        ratio: travel > 0 ? +((giftPos.y - GIFT_EDGE) / travel).toFixed(4) : 0
      })
    )
  } catch (e) {
    /* 存不下就只在本页生效，重启回到默认位置 */
  }
}

// 初始位置：存过就按 side + 比例还原，没存过就用旧版的 right 16 / bottom 20vh
const giftPos = reactive(
  (() => {
    const travel = giftTravelY()
    const saved = readGiftPref()
    if (saved) {
      return {
        x: saved.side === 'left' ? GIFT_EDGE : giftMaxX(),
        y: clampNum(GIFT_EDGE + saved.ratio * travel, GIFT_EDGE, GIFT_EDGE + travel)
      }
    }
    return {
      x: giftMaxX(),
      y: clampNum(window.innerHeight * 0.8 - GIFT_SIZE, GIFT_EDGE, GIFT_EDGE + travel)
    }
  })()
)

// 位置只走 transform：拖动时连续改 left/top 会触发 layout，transform 不会
const giftStyle = computed(() => ({ transform: `translate3d(${giftPos.x}px, ${giftPos.y}px, 0)` }))

const giftDragging = ref(false)
let giftDrag = null
// 拖完松手浏览器还会补一个 click，不吃掉就会「一拖就跳走」
let giftClickBlocked = false

function onGiftDown(e) {
  // 只认主键；右键/中键不该启动拖动
  if (e.pointerType === 'mouse' && e.button !== 0) return
  giftClickBlocked = false
  giftDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: giftPos.x, oy: giftPos.y, moved: false }
  // 捕获指针：手指/鼠标移出按钮范围后仍能收到 move/up，否则拖到一半就断
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch (e2) {
    /* 老浏览器没有这套 API，退化成不加捕获也基本能用 */
  }
}

function onGiftMove(e) {
  if (!giftDrag || e.pointerId !== giftDrag.id) return
  const dx = e.clientX - giftDrag.sx
  const dy = e.clientY - giftDrag.sy
  // 6px 死区：手指点上去时的微小抖动不该被当成拖动
  if (!giftDrag.moved && Math.abs(dx) + Math.abs(dy) < 6) return
  giftDrag.moved = true
  giftDragging.value = true

  const travel = giftTravelY()
  giftPos.x = clampNum(giftDrag.ox + dx, GIFT_EDGE, giftMaxX())
  giftPos.y = clampNum(giftDrag.oy + dy, GIFT_EDGE, GIFT_EDGE + travel)
}

function onGiftUp(e) {
  if (!giftDrag || e.pointerId !== giftDrag.id) return
  const moved = giftDrag.moved
  try {
    e.currentTarget.releasePointerCapture(e.pointerId)
  } catch (e2) {
    /* 已经释放过 */
  }
  giftDrag = null
  giftDragging.value = false
  if (!moved) return

  // 先挡住 click，再吸附 —— click 是在 pointerup 之后立刻派发的，不能等下一帧
  giftClickBlocked = true
  // 兜底：指针在元素外抬起时浏览器不补 click，这个标志会一直留着，
  // 导致下一次点击失效。400ms 足够覆盖 click 的派发时机。
  window.setTimeout(() => {
    giftClickBlocked = false
  }, 400)

  // 下一帧再吸附。摘掉 .is-dragging（transition 恢复）和改坐标如果落在同一次样式计算里，
  // 浏览器看不到「过渡起点」，结果是从拖动位置直接瞬移，吸附过程等于没有。
  window.requestAnimationFrame(() => {
    snapGift()
    saveGiftPref()
  })
}

/** 只归位水平方向；垂直位置是用户真正想表达的「挪到多高」，不动 */
function snapGift() {
  giftPos.x = giftPos.x + GIFT_SIZE / 2 < window.innerWidth / 2 ? GIFT_EDGE : giftMaxX()
}

function onGiftClick() {
  if (giftClickBlocked) {
    giftClickBlocked = false
    return
  }
  router.push('/main/coupon')
}

function onGiftResize() {
  if (giftDrag) return
  const travel = giftTravelY()
  // 视口宽度变了，「靠左还是靠右」的判断基准也变了，按当前中心点重新贴边
  giftPos.x = giftPos.x + GIFT_SIZE / 2 < window.innerWidth / 2 ? GIFT_EDGE : giftMaxX()
  giftPos.y = clampNum(giftPos.y, GIFT_EDGE, GIFT_EDGE + travel)
  saveGiftPref()
}

// 单独注册：不能塞进下面那个 async onMounted，它未登录时会提前 return
onMounted(() => {
  window.addEventListener('resize', onGiftResize)
  if (!giftMql) return
  // addEventListener 是标准写法；Safari 14 之前只有 addListener
  if (giftMql.addEventListener) giftMql.addEventListener('change', onGiftMotionChange)
  else giftMql.addListener(onGiftMotionChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onGiftResize)
  if (!giftMql) return
  if (giftMql.removeEventListener) giftMql.removeEventListener('change', onGiftMotionChange)
  else giftMql.removeListener(onGiftMotionChange)
})

/** 兴趣 **/
const getInterestData = async () => {
  try {
    const res = await getInterests()
    if (res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : []
      if (list.length === 0) interestDialog.value = true
      interest.value = new Set(list)
    }
  } catch {
    /* 静默 */
  }
}

const setInterestList = (list) => {
  interestCatch.value = list
}

const saveInterest = async () => {
  let str = ''
  for (const val of interestCatch.value) {
    const id = typeof val === 'string' ? val : val.id
    str === '' ? (str = id) : (str += `,${id}`)
  }
  if (str === '') {
    ElMessage.warning('您还没有选择兴趣，请先选择兴趣后再保存！')
    return
  }
  try {
    const res = await setInterests({ interestedIds: str })
    if (res.code === 200) {
      ElMessage.success('兴趣保存成功！')
      getInterestData()
      interestDialog.value = false
    } else {
      ElMessage.error(errMsg(res, '保存失败'))
    }
  } catch {
    /* 静默：弹窗还开着，用户可以再点一次 */
  }
}
</script>
<style lang="scss" scoped>
.homeWrapper {
  padding-bottom: 8px;
  min-width: 1220px;
}

/* ===== Hero ===== */
.heroband {
  background: linear-gradient(180deg, #e7eff3 0%, #f5f8fa 100%);
  padding: 36px 0 30px;
  border-bottom: 1px solid var(--line);
}

.hero-in {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 44px;
  align-items: stretch;
  min-height: 212px;
}

.continue {
  display: flex;
  gap: 32px;
  align-items: stretch;

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}

.kicker {
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--main);
  opacity: 0.85;
}

.continue h1 {
  font-size: 30px;
  font-weight: 600;
  margin: 12px 0 8px;
  letter-spacing: -0.4px;
  color: var(--ink);
}

.next {
  font-size: 13px;
  color: var(--ink2);
}

.bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(27, 75, 107, 0.14);
  margin-top: auto;
  overflow: hidden;
  max-width: 520px;

  i {
    display: block;
    height: 100%;
    background: #e8c98a;
    border-radius: 2px;
  }
}

.continue .row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink3);
  margin-top: 12px;
}

.btn-cream {
  margin-left: auto;
  background: var(--main);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 26px;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    background: var(--main-deep);
  }
}

.thumb {
  width: 300px;
  flex: none;
  /* 封面高度随图片比例，不再跟随 Hero 拉伸；底边与「继续学习」按钮对齐 */
  align-self: flex-end;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  box-shadow: 0 8px 22px rgba(27, 75, 107, 0.12);
  cursor: pointer;

  :deep(.cover) {
    border-radius: 0;
  }
}

.glass {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(26, 29, 33, 0.04);

  h3 {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.45;
    margin: 12px 0 8px;
    color: var(--ink);
  }

  p {
    font-size: 12.5px;
    line-height: 1.8;
    color: var(--ink2);
    margin: 0;
  }

  .gfoot {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 14px;
    font-size: 11.5px;
    color: var(--ink3);

    .sp {
      margin-left: auto;
      display: flex;
      gap: 14px;
      color: var(--main);
      cursor: pointer;
    }
  }
}

.gtag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 1px;
  color: #a4722b;
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 3px 11px;
  align-self: flex-start;
}

/* ===== 区块头 ===== */
.sec {
  margin-top: 56px;
}

.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.sec-l {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.sec-title {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--ink);
}

.sec-sub {
  font-size: 13px;
  color: var(--ink3);
  margin-top: 5px;
}

.more {
  font-size: 13px;
  color: var(--ink3);
  cursor: pointer;

  &:hover {
    color: var(--main);
  }
}

/* ===== 01 专题 ===== */
.topics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

/* ===== 02 混排 ===== */
.chips {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chip {
  font-size: 13px;
  color: var(--ink2);
  background: var(--paper);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 15px;
  cursor: pointer;
  transition: color 0.15s;

  /* 悬停只变文字色，不做底色——避免和选中态混淆 */
  &:hover {
    color: var(--main);
  }

  &.on {
    color: var(--main);
    background: var(--main-soft);
    font-weight: 500;
  }
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: stretch;
}

/* 加载骨架屏：与课程卡轮廓一致的灰块 */
.skel {
  border-radius: var(--radius-md);

  .skel-pic {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-md);
    background: linear-gradient(100deg, #eef2f5 40%, #f7fafc 50%, #eef2f5 60%);
    background-size: 200% 100%;
    animation: skel 1.4s infinite;
  }

  .skel-l1 {
    height: 15px;
    margin: 14px 2px 0;
    border-radius: 4px;
    background: #eef2f5;
  }

  .skel-l2 {
    height: 11px;
    width: 55%;
    margin: 10px 2px 4px;
    border-radius: 4px;
    background: #f1f5f8;
  }
}

@keyframes skel {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.mixEmpty {
  padding: 52px 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--ink3);
}

.pager {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  .pg,
  .nav {
    font-size: 13px;
    min-width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    color: var(--ink2);
    background: var(--surface);
    border: 1px solid var(--line);
    transition: 0.15s;
    padding: 0 10px;
    font-variant-numeric: tabular-nums;
  }

  .pg:hover {
    color: var(--main);
    border-color: #c8d8e2;
  }

  .pg.on {
    color: var(--main);
    background: var(--main-soft);
    border-color: #c8d8e2;
    font-weight: 500;
  }

  .nav:hover:not(.dis) {
    color: var(--main);
    border-color: #c8d8e2;
  }

  .nav.dis {
    opacity: 0.4;
    cursor: default;
  }
}

/* ===== 03 交流 ===== */
.split {
  display: grid;
  grid-template-columns: 1fr 392px;
  gap: 24px;
  align-items: stretch;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.feed {
  padding: 4px 22px;
}

.post {
  display: flex;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover .t {
    color: var(--main);
  }

  .av {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--tint);
    display: grid;
    place-items: center;
    font-size: 11px;
    color: var(--ink2);
    flex: none;
  }

  .t {
    font-size: 14px;
    line-height: 1.5;
    transition: color 0.18s;
    color: var(--ink);
  }

  .m {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 4px;
    display: flex;
    gap: 10px;

    b {
      font-weight: 400;
      color: var(--accent);
    }
  }
}

/* ===== 兴趣弹窗 ===== */
.dialogHead {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .titleClass {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-font1);
  }

  .dialogSub {
    margin-left: 10px;
  }
}

.butCont {
  display: flex;
  align-items: center;

  .bt,
  .bt-grey {
    width: auto;
    padding: 0 22px;
  }

  .bt-grey {
    margin-right: 15px;
  }
}

/* 右下角浮动优惠券礼包（首页唯一通往领券页的入口，背景见模板上的注释）。
   尺寸沿用旧版 .floatCont 的 110×110；默认落点也沿用 right 16 / bottom 20vh，
   但位置改由 JS 的 transform 接管，所以能拖。
   做成 <button> 而不是 <a>：旧版那个 <a> 没有 href，键盘 Tab 不到，
   鼠标以外的用户根本发现不了它是个入口。拖动只是增强，键盘用户照旧 Enter 进入。 */
.giftFloat {
  /* 位置全部由 JS 的 translate3d 决定（见 giftStyle），这里不再用 right/bottom：
     拖动要连续改坐标，改 left/top 会触发 layout，改 transform 不会。
     所以 hover / active 的反馈只能做在 img 上 —— 内联 style 的 transform 会盖住
     类选择器里的 transform，写在这里等于没写。 */
  position: fixed;
  left: 0;
  top: 0;
  z-index: 20;
  width: 110px;
  height: 110px;
  padding: 0;
  border: none;
  border-radius: 14px;
  background: none;
  cursor: grab;
  overflow: hidden;
  transition: transform .22s cubic-bezier(.22, .61, .36, 1);

  /* 拖动必须独占手势：不写这条，手指在球上滑动会先把页面滚起来，指到哪滚到哪 */
  touch-action: none;
  /* 长按别弹系统菜单 —— 球里是 img，iOS 会弹「存储图像」 */
  -webkit-touch-callout: none;
  user-select: none;

  /* 原图 360×360，但礼盒只占中间 x[118,251] y[105,275]（134×171），
     四周全是透明留白 —— 宽只占画布的 37%，高只占 47%。
     直接 width:100% 铺满的话，110 的框里礼盒只有 41×52，入口等于被缩小了一半多，
     连带角标也会落在留白上「浮」着离图标很远（第一版就是这样）。
     所以反向放大 0.62 倍，并把内容中心对齐到框中心：
       内容中心在画布 (184.5, 190)，×0.62 后是 (114.4, 117.8)，
       要落到框中心 (55, 55)，img 左上就是 (-59, -63)，边长 360×0.62≈223。
     ⚠️ 换掉这张图就得重新算这四个数。 */
  img {
    position: absolute;
    left: -59px;
    top: -63px;
    width: 223px;
    height: 223px;
    max-width: none;
    /* 让指针事件永远落在 button 上（pointerdown 的 currentTarget 才稳定），
       同时禁掉图片原生拖拽，否则桌面端一拖会先拖出一个半透明的 ghost image */
    pointer-events: none;
    -webkit-user-drag: none;
    transition: transform .2s;
  }

  &:hover img {
    transform: scale(1.06);
  }

  /* 按下去要有回执：110px 的图如果不给按压反馈，会让人怀疑没点中 */
  &:active img {
    transform: scale(.95);
  }

  /* 拖动中：去掉 transition 才能跟手（否则每次 move 都在补间，手感是「果冻」），
     同时抬高层级、放大一点，让用户确认「抓住了」 */
  &.is-dragging {
    transition: none;
    cursor: grabbing;
    z-index: 30;

    img {
      transform: scale(1.08);
    }
  }

  &:focus-visible {
    outline: 2px solid #D9A441;
    outline-offset: 4px;
  }
}

/* 可领张数角标。只在 couponNum > 0 时渲染，所以不用处理「显示 0」的样式 */
.giftBadge {
  position: absolute;
  top: 2px;
  right: 2px;
  box-sizing: border-box;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: #fff;
  text-align: center;
  background: linear-gradient(135deg, #E8664D, #D33A26);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(211, 58, 38, .35);
}
</style>
