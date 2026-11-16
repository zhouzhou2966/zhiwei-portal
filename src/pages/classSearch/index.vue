<!-- 探索页 · 知识广场（v41）
     两态两模式：
       无 keyword = 浏览态，默认「逛内容」；mode=course 时切到「按分类找课」（原课程列表，保留筛选/排序/分页）
       有 keyword = 搜索态（与旧版完全一致，Header 搜索把关键词写进 dataCache.getSearchKey）
     逛内容 = 四个门 + 三个真问题 + 专题路径 + 90 秒知识流 + 笔记/待解问题，
     这一模式下不出现课程卡，课程只以「关联课程」文字链接出现。
     数据：课程/分类/问答/笔记走真实接口；知识卡与专题是冷启动 mock（见 mock/knowledge.js、mock/topics.js）。 -->
<template>
  <div class="exploreWrapper">
    <div class="container">
      <!-- 浏览态 -->
      <div class="ex" v-if="!searching">
        <header class="exhead">
          <div class="exhead-l">
            <h2>探索</h2>
            <div class="sub">首页接着学，这里随便逛 —— 同一批知识，换个维度看</div>
          </div>
          <div class="modes">
            <span :class="{ on: mode === 'content' }" @click="setMode('content')">逛内容</span>
            <span :class="{ on: mode === 'course' }" @click="setMode('course')">按分类找课</span>
          </div>
        </header>

        <!-- ========== 模式一：逛内容 ========== -->
        <template v-if="mode === 'content'">
          <GateTiles :items="gates" @pick="jump" />

          <!-- 02 三个真问题 -->
          <section class="block" id="sec-hooks">
            <div class="bhead">
              <div class="btl">不知道想学什么？先解三个真问题</div>
              <div class="bsub">每个问句背后是一张知识卡，90 秒能读完</div>
            </div>
            <div class="hooks">
              <div class="hook" v-for="h in hooks" :key="h.card.id" @click="openCard(h.card)">
                <div class="q">{{ h.q }}</div>
                <div class="m">{{ h.card.tag }} · {{ h.card.read }}</div>
                <span class="go">看答案 →</span>
              </div>
            </div>
          </section>

          <!-- 03 专题路径 -->
          <section class="block" id="sec-path">
            <div class="bhead">
              <div class="btl">沿着一条线学下去</div>
              <div class="bsub">专题把课程和知识卡排成路径，节点就是下一步</div>
            </div>
            <div class="paths">
              <PathRail v-for="t in TOPICS" :key="t.id" :topic="t" @open="openPath" />
            </div>
          </section>

          <!-- 04 90 秒知识流 -->
          <section class="block" id="sec-cards">
            <div class="bhead bhead-row">
              <div>
                <div class="btl">90 秒知识流</div>
                <div class="bsub">一条一个知识点，读完就走，不用报名</div>
              </div>
              <div class="themes">
                <span
                  v-for="d in themeChips"
                  :key="d.key"
                  class="chip"
                  :class="{ on: theme === d.key }"
                  @click="pickTheme(d.key)"
                >{{ d.label }}</span>
              </div>
            </div>

            <div class="flow">
              <ReadingCard
                v-for="c in cardsShown"
                :key="c.id"
                :card="c"
                @open="openCard"
                @course="openCourseByName"
              />
            </div>
            <div class="loadmore" v-if="cardsShown.length < cardsPool.length" @click="loadMore">
              继续看，还剩 {{ cardsPool.length - cardsShown.length }} 张 ↓
            </div>
            <div class="bempty" v-if="!cardsPool.length">这个主题下暂时没有卡片，换个主题试试</div>
          </section>

          <!-- 05 笔记 / 待解问题 -->
          <section class="block" id="sec-ugc">
            <div class="duo">
              <div class="panel">
                <div class="phead">
                  <span>大家在记什么</span>
                  <span class="pn">{{ notes.length }} 条公开笔记</span>
                </div>
                <NoteCard v-for="n in notes" :key="n.id" :note="n" @open="goChat" />
                <div class="pempty" v-if="!notes.length">还没有公开笔记，去课程里记下第一条</div>
              </div>

              <div class="panel">
                <div class="phead">
                  <span>待解决的问题</span>
                  <span class="pn">{{ openCount }} 个还没人答</span>
                </div>
                <QuestionItem v-for="q in questions" :key="q.id" :q="q" @open="goChat" />
                <div class="pempty" v-if="!questions.length">暂时没有待解答的问题</div>
              </div>
            </div>
          </section>
        </template>

        <!-- ========== 模式二：按分类找课（原课程列表） ========== -->
        <div class="courseWrap" v-else>
          <aside class="filter">
            <div class="grp">
              <h5>收付费</h5>
              <div class="it" v-for="f in costFilters" :key="f.id" :class="{ on: costFilter === f.id }"
                   @click="pickCost(f.id)">{{ f.name }}</div>
            </div>
            <div class="grp">
              <h5>课程分类</h5>
              <div class="it" :class="{ on: catId === 'all' }" @click="pickCat('all')">全部课程</div>
              <div class="it" v-for="c in categories" :key="c.id" :class="{ on: catId === c.id }"
                   @click="pickCat(c.id)">{{ c.name }}</div>
            </div>
          </aside>

          <section>
            <div class="chead">
              <div class="cnt">共 {{ count }} 门课程</div>
              <div class="sorts">
                <span v-for="s in soleBar" :key="s.value" :class="{ on: sortBy === s.value }"
                      @click="sortHandle(s.value)">{{ s.key }}</span>
              </div>
            </div>

            <div class="grid3">
              <CourseCard v-for="item in browseMix" :key="item.id" :data="item" @open="goDetails" />
            </div>
            <div class="bempty" v-if="browseMix.length === 0">这个筛选下暂时没有课程，换个条件试试</div>

            <div class="pager" v-if="totalPages > 1 && browseMix.length > 0">
              <span class="nav" :class="{ dis: browsePage === 1 }" @click="turnPage(browsePage - 1)">上一页</span>
              <span v-for="p in totalPages" :key="p" class="pg" :class="{ on: p === browsePage }"
                    @click="turnPage(p)">{{ p }}</span>
              <span class="nav" :class="{ dis: browsePage === totalPages }" @click="turnPage(browsePage + 1)">下一页</span>
            </div>
          </section>
        </div>
      </div>

      <!-- 搜索态 -->
      <div class="qwrap" v-else>
        <div class="qbar">
          <h2>“{{ searchParams.keyword }}”的搜索结果</h2>
          <span class="qn">共 {{ resTotal }} 条 · 课程 {{ count }} · 知识卡 {{ kwCards.length }} · 问答 {{ kwPosts.length }}</span>
        </div>
        <div class="qfilter">
          <span class="chip" :class="{ on: resType === 'all' }" @click="resType = 'all'">全部 {{ resTotal }}</span>
          <span class="chip" :class="{ on: resType === 'course' }" @click="resType = 'course'">课程 {{ count }}</span>
          <span class="chip" :class="{ on: resType === 'kcard' }" @click="resType = 'kcard'">知识卡 {{ kwCards.length }}</span>
          <span class="chip" :class="{ on: resType === 'qa' }" @click="resType = 'qa'">问答 {{ kwPosts.length }}</span>
          <span class="more" style="margin-left:auto" @click="clearSearchKey">退出搜索</span>
        </div>

        <div class="reslist">
          <template v-if="resType === 'all' || resType === 'course'">
            <div class="res" v-for="(item, i) in searchResultData" :key="'c' + i" @click="goDetails(item)">
              <span class="rk">课程</span>
              <div>
                <div class="res-t" v-html="item.name"></div>
                <div class="res-d">{{ item.sections || 0 }} 节 · {{ item.teacher || '知微讲师' }}</div>
                <div class="res-m">
                  {{ Number(item.price) === 0 ? '免费' : `￥${(Number(item.price) / 100).toFixed(2)}` }}
                  · {{ item.sold || 0 }} 人在学
                </div>
              </div>
            </div>
          </template>
          <template v-if="resType === 'all' || resType === 'kcard'">
            <div class="res" v-for="(item, i) in kwCards" :key="'k' + i" @click="openCard(item)">
              <span class="rk">知识卡</span>
              <div>
                <div class="res-t">{{ item.title }}</div>
                <div class="res-d">{{ item.summary }}</div>
                <div class="res-m">{{ domainLabel(item.domain) }} · {{ item.read }}</div>
              </div>
            </div>
          </template>
          <template v-if="resType === 'all' || resType === 'qa'">
            <div class="res" v-for="(item, i) in kwPosts" :key="'p' + i" @click="goChat">
              <span class="rk">问答</span>
              <div>
                <div class="res-t">{{ item.title }}</div>
                <div class="res-d">{{ item.replies }} 条回复 · {{ item.tag }}</div>
                <div class="res-m">交流区</div>
              </div>
            </div>
          </template>
          <div class="resmore" v-if="resTotal > 5">共 {{ resTotal }} 条结果，仅展示前 5 条 · <span @click="resType = 'all'">查看全部 →</span></div>
          <div class="bempty" v-if="resTotal === 0">没有找到与「{{ searchParams.keyword }}」相关的内容</div>
        </div>
      </div>
    </div>

    <!-- 知识卡浮层：卡片/问句点开后在这里读完，不需要额外详情页 -->
    <div class="sheetMask" v-if="activeCard" @click.self="activeCard = null">
      <div class="sheet" :style="{ '--k': activeColor }">
        <div class="sheetHead">
          <span class="kind">{{ activeCard.kind === 'qa' ? '问答' : '知识卡' }} · {{ activeCard.tag }}</span>
          <span class="close" @click="activeCard = null">✕</span>
        </div>
        <h3>{{ activeCard.title }}</h3>
        <p class="sum">{{ activeCard.summary }}</p>
        <ul v-if="activeCard.bullets && activeCard.bullets.length">
          <li v-for="(b, i) in activeCard.bullets" :key="i">{{ b }}</li>
        </ul>
        <div class="sheetFoot">
          <span>{{ activeCard.read }}</span>
          <span>·</span>
          <span>{{ activeCard.saves }}</span>
          <span class="cu" v-if="activeCard.course" @click="openCourseByName(activeCard.course)">
            去课程《{{ activeCard.course }}》→
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { classSeach, getClassCategorys } from '@/api/class.js'
import { getAllNotes } from '@/api/notes.js'
import { getAskList } from '@/api/classDetails.js'
import { getToken } from '@/utils/authToken'
import CourseCard from '@/components/ui/CourseCard.vue'
import GateTiles from '@/components/ui/GateTiles.vue'
import PathRail from '@/components/ui/PathRail.vue'
import ReadingCard from '@/components/ui/ReadingCard.vue'
import NoteCard from '@/components/ui/NoteCard.vue'
import QuestionItem from '@/components/ui/QuestionItem.vue'
import { dataCacheStore } from '@/store'
import { KNOWLEDGE_CARDS, DOMAINS, DOMAIN_COLORS, searchCards } from '@/mock/knowledge'
import { TOPICS, FEED_POSTS } from '@/mock/topics'

const route = useRoute()
const dataCache = dataCacheStore()
const router = useRouter()

const categories = ref([])
const searchResultData = ref([])
const count = ref(0)
const fullPath = ref(route.fullPath)
const catId = ref('all')
const costFilter = ref('all')
const sortBy = ref('all')

// 浏览态模式：逛内容（默认）/ 按分类找课
const mode = ref(route.query.tab === 'course' ? 'course' : 'content')
const setMode = (m) => {
  mode.value = m
  if (m === 'course') initPage()
}

const searchParams = ref({
  keyword: '',
  categoryIdLv1: '',
  categoryIdLv2: '',
  categoryIdLv3: '',
  free: undefined,
  sortBy: undefined,
  pageNo: 1,
  // 一次拉全量，浏览态在前端分页（库里课程量级小，没必要来回翻接口）
  pageSize: 50
})

// 搜索态开关：缓存里有关键词即搜索态
const searching = computed(() => !!dataCache.getSearchKey)

onMounted(async () => {
  // 直接带 ?key= 打开时也要生效（关键词存在 dataCache，刷新后是旧值）
  if (route.query.key !== undefined) dataCache.setSearchKey(route.query.key || '')
  getClassCategoryData()
  // 先拿课程全量：笔记/问答要按 courseId 聚合，也用于「关联课程」的名字反查
  await search()
  loadUgc()
})

onUnmounted(() => {
  dataCache.setSearchKey('')
})

// 顶部导航分类 / 首页分类条跳转进来：query.type + query.id
watchEffect(() => {
  if (route.fullPath != fullPath.value) {
    fullPath.value = route.fullPath
    if (route.query.type && ['categoryIdLv1', 'categoryIdLv2'].includes(route.query.type)) {
      searchParams.value[route.query.type] = route.query.id
      catId.value = route.query.id
      mode.value = 'course'
    }
    if (route.query.tab === 'course') mode.value = 'course'
    if (route.query.key !== undefined) {
      dataCache.setSearchKey(route.query.key || '')
    }
    initPage()
    search()
  }
})

// 关键词变化（Header 搜索框写入缓存）
watchEffect(() => {
  searchParams.value.keyword = dataCache.getSearchKey || ''
})

const costFilters = [
  { id: 'all', name: '全部' },
  { id: '1', name: '免费' },
  { id: '0', name: '付费' }
]
const soleBar = [
  { key: '综合', value: 'all' },
  { key: '最新', value: 'publishTime' },
  { key: '最热', value: 'sold' }
]

const pickCat = (id) => {
  catId.value = id
  searchParams.value.categoryIdLv1 = id !== 'all' ? id : undefined
  searchParams.value.categoryIdLv2 = undefined
  initPage()
  search()
}

const pickCost = (id) => {
  costFilter.value = id
  searchParams.value.free = id !== 'all' ? Boolean(Number(id)) : undefined
  initPage()
  search()
}

const sortHandle = (v) => {
  sortBy.value = v
  searchParams.value.sortBy = v !== 'all' ? v : undefined
  initPage()
  search()
}

/* ===== 模式二：按分类找课 ===== */
const browsePage = ref(1)

const initPage = () => {
  browsePage.value = 1
  searchParams.value.pageNo = 1
}

/* ===== 模式一：逛内容 ===== */
const theme = ref('all')
const themeChips = computed(() => [
  { key: 'all', label: '全部' },
  ...DOMAINS.map((d) => ({ key: d.key, label: d.label }))
])

// 知识流：按领域过滤，一次 6 条，点「继续看」追加
const FLOW_STEP = 6
const flowSize = ref(FLOW_STEP)
const cardsPool = computed(() => {
  const list = KNOWLEDGE_CARDS.filter((c) => theme.value === 'all' || c.domain === theme.value)
  return list
})
const cardsShown = computed(() => cardsPool.value.slice(0, flowSize.value))
const pickTheme = (k) => {
  theme.value = k
  flowSize.value = FLOW_STEP
}
const loadMore = () => {
  flowSize.value += FLOW_STEP
}

// 三个真问题：挑三张「痛点型」知识卡，标题改写成问句（卡本身不动）
const HOOKS = [
  { q: 'flex 子项为什么就是不肯缩？', id: 'it02' },
  { q: '闭包到底记住了什么？', id: 'it03' },
  { q: '单体什么时候该拆？', id: 'it08' }
]
const hooks = computed(() =>
  HOOKS.map((h) => ({ ...h, card: KNOWLEDGE_CARDS.find((c) => c.id === h.id) })).filter((h) => h.card)
)

// 四个门：数量取自真实内容池，点击做页内锚点
const unanswered = computed(() => questions.value.filter((q) => !q.answerTimes).length)
const gates = computed(() => [
  { key: 'sec-path', title: '专题路径', meta: `${TOPICS.length} 条线 · 按顺序走`, color: DOMAIN_COLORS.it },
  { key: 'sec-cards', title: '知识卡', meta: `${KNOWLEDGE_CARDS.length} 张 · 90 秒读完`, color: DOMAIN_COLORS.design },
  { key: 'sec-ugc', title: '笔记广场', meta: `${notes.value.length} 条公开笔记`, color: DOMAIN_COLORS.hobby },
  { key: 'sec-ugc', title: '待解问题', meta: `${unanswered.value} 个还没人答`, color: DOMAIN_COLORS.work }
])

const jump = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ===== 知识卡浮层 ===== */
const activeCard = ref(null)
const activeColor = computed(() =>
  activeCard.value ? DOMAIN_COLORS[activeCard.value.domain] || DOMAIN_COLORS.it : DOMAIN_COLORS.it
)
const openCard = (card) => {
  activeCard.value = card
}

/* ===== 笔记 / 待解问题 ===== */
// 冷启动兜底：库里公开笔记只有两条测试内容（"我明白了，111"），
// 内容不足 3 条时用这组示例把版面撑住；真实内容够了自动不展示。
const DEMO_NOTES = [
  { id: 'dn1', authorName: '林一', content: '把配置中心那一章拆成三张图：注册、拉取、推送。@RefreshScope 是这么生效的。', courseName: '可能是史上最全的微服务技术栈课程', noteMoment: 312, createTime: '3 天前' },
  { id: 'dn2', authorName: '苏禾', content: 'flex 这一节最有用的是 min-width:0 那句，长文本把布局撑爆的问题终于有解了。', courseName: 'Java 程序员的前端课程', noteMoment: 96, createTime: '1 周前' },
  { id: 'dn3', authorName: '陈默', content: '单体拆分那节反复强调「团队人数先于技术指标」，记下来提醒自己别为了拆而拆。', courseName: '可能是史上最全的微服务技术栈课程', noteMoment: 508, createTime: '2 天前' }
]
// 问答全局查询目前被后端校验挡住（课程id和章节id不能同时为空），先用这组示例
const DEMO_QUESTIONS = [
  { id: 'dq1', title: '分布式事务到底该选 TCC 还是 Saga？', answerTimes: 0, userName: '林一', createTime: '今天' },
  { id: 'dq2', title: '闭包捕获的是引用，那循环里用 let 为什么就好了？', answerTimes: 0, userName: '苏禾', createTime: '昨天' },
  { id: 'dq3', title: '微服务拆分之后，本地联调有什么好办法？', answerTimes: 2, userName: '陈默', createTime: '2 天前' },
  { id: 'dq4', title: '课程里的 Docker 章节和公司现网环境差很多，需要补什么？', answerTimes: 0, userName: '何遇', createTime: '3 天前' }
]

const notes = ref(DEMO_NOTES)
const questions = ref(DEMO_QUESTIONS)
const openCount = computed(() => questions.value.filter((q) => !q.answerTimes).length)

// 笔记：GET /ls/notes/page?onlyMine=false 支持全局公开笔记（后端 courseId/sectionId 都是可选条件）
// 问答：GET /ls/questions/page 必须带 courseId 或 sectionId，全局查询会 400 —— 先按课程聚合
const loadUgc = async () => {
  // 游客不拉这两个接口：401 会触发全局「登录超时」弹窗，公共页面不该弹
  if (!getToken()) return

  try {
    const res = await getAllNotes({ pageNo: 1, pageSize: 6, onlyMine: false })
    if (res && res.code == 200 && res.data && Array.isArray(res.data.list) && res.data.list.length >= 3) {
      notes.value = res.data.list.map((n) => ({
        ...n,
        createTime: (n.createTime || '').slice(0, 10)
      }))
    }
  } catch {
    /* 静默：用示例内容兜底 */
  }

  try {
    // 先试全局查询：后端放宽「课程id和章节id不能同时为空」后走这条，一次就够
    let merged = []
    const all = await getAskList({ pageNo: 1, pageSize: 8, onlyMine: false }).catch(() => null)
    if (all && all.code == 200 && all.data) {
      merged = all.data.list || []
    } else {
      // 兜底：后端仍在校验时按课程并发聚合
      const list = searchResultData.value || []
      const results = await Promise.all(
        list.slice(0, 4).map((c) =>
          getAskList({ pageNo: 1, pageSize: 5, courseId: c.id, onlyMine: false })
            .then((r) => (r && r.code == 200 && r.data ? r.data.list || [] : []))
            .catch(() => [])
        )
      )
      merged = results.flat()
    }
    merged = merged
      .map((q) => ({ ...q, createTime: (q.createTime || '').slice(0, 10), courseName: '' }))
      .filter((q) => /[\u4e00-\u9fa5]/.test(q.title || '') && q.title.length >= 6)
      .sort((a, b) => (a.answerTimes || 0) - (b.answerTimes || 0))
      .slice(0, 4)
    // 真实内容不足 3 条时保留示例（库里目前是「111」「求失败的原因？」这类测试串）
    if (merged.length >= 3) questions.value = merged
  } catch {
    /* 静默：用示例内容兜底 */
  }
}

/* ===== 模式二：按分类找课 ===== */
const PAGE_SIZE = 12
const totalPages = computed(() => Math.max(1, Math.ceil(searchResultData.value.length / PAGE_SIZE)))
const browseMix = computed(() =>
  searchResultData.value.slice((browsePage.value - 1) * PAGE_SIZE, browsePage.value * PAGE_SIZE)
)

const turnPage = (p) => {
  if (p < 1 || p > totalPages.value || p === browsePage.value) return
  browsePage.value = p
  document.querySelector('.grid3')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const search = async () => {
  const params = JSON.parse(JSON.stringify({ ...searchParams.value }))
  try {
    const res = await classSeach(params)
    if (res.code == 200) {
      searchResultData.value = res.data.list || []
      count.value = Number(res.data.total) || 0
    } else {
      searchResultData.value = []
      count.value = 0
    }
  } catch {
    // 课程拉不到时只影响「按分类找课」，知识流不糊 toast
    searchResultData.value = []
    count.value = 0
  }
}

const getClassCategoryData = async () => {
  try {
    const res = await getClassCategorys()
    if (res.code === 200) {
      categories.value = res.data || []
    }
  } catch {
    /* 静默 */
  }
}

const clearSearchKey = () => {
  dataCache.setSearchKey('')
  searchParams.value.keyword = ''
  initPage()
  search()
}

// 领域筛选（作用于知识卡）
const domainLabel = (d) => (DOMAINS.find((x) => x.key === d) || {}).label || d

// 搜索态结果
const kwCards = computed(() => searchCards(searchParams.value.keyword))
const kwPosts = computed(() => {
  const kw = (searchParams.value.keyword || '').toLowerCase()
  if (!kw) return []
  return FEED_POSTS.filter((p) => p.title.toLowerCase().includes(kw) || p.tag.includes(kw))
})
const resTotal = computed(() => count.value + kwCards.value.length + kwPosts.value.length)
const resType = ref('all')

const goDetails = (item) => {
  router.push({ path: '/details/index', query: { id: item.id } })
}
const goChat = () => {
  router.push('/main/chat')
}

// 课程名 → 课程 id：用全量列表按名字匹配（专题里只存了课程名）
const openCourseByName = (name) => {
  const hit = searchResultData.value.find((c) => c.name === name) ||
    searchResultData.value.find((c) => name && c.name && c.name.includes(name))
  if (hit) {
    activeCard.value = null
    goDetails(hit)
    return
  }
  router.push('/main/index')
}

// 专题：有匹配课程就进课程，没有就打开这条线的第一张卡
const openPath = (topic) => {
  const hit = searchResultData.value.find((c) => c.name === topic.course)
  if (hit) {
    goDetails(hit)
    return
  }
  const first = KNOWLEDGE_CARDS.find((c) => topic.cards.includes(c.id))
  if (first) openCard(first)
}
</script>
<style lang="scss" scoped>
.exploreWrapper {
  padding-top: 28px;
  padding-bottom: 40px;
  min-width: 1220px;
}

/* ===== 页头 ===== */
.exhead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);

  h2 {
    font-size: 25px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--ink);
    margin: 0;
  }

  .sub {
    font-size: 13px;
    color: var(--ink3);
    margin-top: 5px;
  }
}

.modes {
  display: flex;
  gap: 4px;
  background: var(--paper);
  border-radius: 999px;
  padding: 3px;

  span {
    font-size: 12.5px;
    color: var(--ink2);
    padding: 6px 15px;
    border-radius: 999px;
    cursor: pointer;
    transition: 0.18s;

    &.on {
      background: var(--surface);
      color: var(--main);
      font-weight: 500;
      box-shadow: var(--shadow-1);
    }
  }
}

/* ===== 区块通用 ===== */
.block {
  margin-top: 44px;
  scroll-margin-top: 24px;
}

.bhead {
  margin-bottom: 16px;

  .btl {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--ink);
  }

  .bsub {
    font-size: 12.5px;
    color: var(--ink3);
    margin-top: 5px;
  }

  &.bhead-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }
}

.themes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .chip {
    font-size: 12.5px;
    color: var(--ink2);
    background: var(--paper);
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 6px 14px;
    cursor: pointer;
    transition: color 0.15s;
    white-space: nowrap;

    &:hover {
      color: var(--main);
    }

    &.on {
      color: var(--main);
      background: var(--main-soft);
      font-weight: 500;
    }
  }
}

.bempty,
.pempty {
  padding: 26px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ink3);
}

/* ===== 02 三个真问题 ===== */
.hooks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.hook {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 18px 20px;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  position: relative;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-2);

    .go {
      color: var(--main);
    }
  }

  .q {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    color: var(--ink);
    letter-spacing: -0.2px;
  }

  .m {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 10px;
  }

  .go {
    position: absolute;
    right: 20px;
    bottom: 16px;
    font-size: 12px;
    color: var(--ink3);
    transition: color 0.18s;
  }
}

/* ===== 03 专题路径 ===== */
.paths {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 6px 4px;
}

/* ===== 04 知识流 ===== */
.flow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.loadmore {
  margin-top: 22px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink2);
  cursor: pointer;
  padding: 12px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  transition: 0.18s;

  &:hover {
    color: var(--main);
    border-color: var(--main-light2, #c8d8e2);
  }
}

/* ===== 05 笔记 / 待解问题 ===== */
.duo {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  align-items: start;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 6px 22px 10px;

  .phead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);

    > span:first-child {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
    }

    .pn {
      font-size: 11.5px;
      color: var(--ink3);
    }
  }
}

/* ===== 模式二：按分类找课 ===== */
.courseWrap {
  display: grid;
  grid-template-columns: 216px 1fr;
  gap: 32px;
  margin-top: 20px;
}

.filter {
  border-right: 1px solid var(--line);
  padding-right: 28px;

  h5 {
    font-size: 11px;
    letter-spacing: 1.2px;
    color: var(--ink3);
    margin: 0 0 10px;
    font-weight: 400;
  }

  .grp {
    margin-bottom: 26px;
  }

  .it {
    font-size: 13.5px;
    color: var(--ink2);
    padding: 6px 0;
    cursor: pointer;

    &:hover {
      color: var(--main);
    }

    &.on {
      color: var(--main);
      font-weight: 500;
    }
  }
}

.chead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);

  .cnt {
    font-size: 13px;
    color: var(--ink3);
  }
}

.sorts {
  display: flex;
  gap: 18px;
  font-size: 13px;
  color: var(--ink3);

  span {
    cursor: pointer;
    position: relative;
    padding: 3px 0;
    transition: color 0.15s;

    &:hover {
      color: var(--ink2);
    }

    &.on {
      color: var(--main);
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -2px;
        height: 2px;
        background: var(--main);
        border-radius: 2px;
      }
    }
  }
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 16px;
  align-items: stretch;
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

/* ===== 搜索态 ===== */
.qwrap {
  margin-top: 4px;
}

.qbar {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0 16px;
  border-bottom: 1px solid var(--line);

  h2 {
    font-size: 23px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--ink);
    margin: 0;
  }

  .qn {
    font-size: 13px;
    color: var(--ink3);
  }
}

.qfilter {
  display: flex;
  gap: 8px;
  margin: 16px 0 4px;
  align-items: center;

  .chip {
    font-size: 13px;
    color: var(--ink2);
    background: var(--paper);
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 6px 15px;
    cursor: pointer;

    &.on {
      color: var(--main);
      background: var(--main-soft);
      font-weight: 500;
    }
  }
}

.res {
  display: flex;
  gap: 16px;
  padding: 17px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;

  &:hover .res-t {
    color: var(--main);
  }

  .rk {
    font-size: 11px;
    color: var(--ink3);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 2px 0;
    height: fit-content;
    flex: none;
    width: 46px;
    text-align: center;
    margin-top: 2px;
  }

  .res-t {
    font-size: 15px;
    font-weight: 500;
    transition: color 0.18s;
    color: var(--ink);
  }

  .res-d {
    font-size: 13px;
    color: var(--ink2);
    margin-top: 5px;
    line-height: 1.7;
  }

  .res-m {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 7px;
  }
}

.resmore {
  padding: 16px 0 4px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink3);

  span {
    color: var(--main);
    cursor: pointer;
  }
}

/* ===== 知识卡浮层 ===== */
.sheetMask {
  position: fixed;
  inset: 0;
  background: rgba(18, 25, 32, 0.42);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 40px;
}

.sheet {
  width: 620px;
  max-width: 100%;
  max-height: 78vh;
  overflow: auto;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border-top: 3px solid var(--k);
  padding: 22px 28px 20px;
  box-shadow: var(--shadow-3);

  .sheetHead {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .kind {
      font-size: 11px;
      letter-spacing: 0.8px;
      color: var(--k);
      background: color-mix(in srgb, var(--k) 10%, #fff);
      border-radius: 999px;
      padding: 3px 11px;
      font-weight: 500;
    }

    .close {
      font-size: 13px;
      color: var(--ink3);
      cursor: pointer;
      padding: 4px;

      &:hover {
        color: var(--ink);
      }
    }
  }

  h3 {
    font-size: 21px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--ink);
    margin: 16px 0 10px;
    letter-spacing: -0.3px;
  }

  .sum {
    font-size: 13.5px;
    line-height: 1.85;
    color: var(--ink2);
    margin: 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 14px 0 0;

    li {
      position: relative;
      padding-left: 14px;
      font-size: 13px;
      line-height: 1.95;
      color: var(--ink2);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 11px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--k);
        opacity: 0.8;
      }
    }
  }

  .sheetFoot {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
    font-size: 11.5px;
    color: var(--ink3);

    .cu {
      margin-left: auto;
      color: var(--main);
      cursor: pointer;
      max-width: 70%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
