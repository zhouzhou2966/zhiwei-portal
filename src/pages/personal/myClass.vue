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
          在学 <b>{{ activeCount }}</b> 门 · 已学完 <b>{{ finishedCount }}</b> 门
          · 共 <b>{{ learnedTotal }}</b> 节已学
        </p>
      </div>
      <div class="mcTools">
        <div class="mcSearch">
          <input v-model.trim="keyword" type="text" placeholder="在课程里搜索">
          <span v-if="keyword" class="mcClear" @click="keyword = ''">×</span>
        </div>
        <span class="mcSort" @click="toggleSort">{{ sortLabel }}</span>
      </div>
    </header>

    <div class="mcTabs">
      <span class="mcTab" :class="{ on: tab === 'learning' }" @click="setTab('learning')">
        在学 <i>{{ activeCount }}</i>
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
                @saved="getMyLessonsData" @deleted="getMyLessonsData"></PlanDialog>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errMsg, catchMsg } from '@/utils/request'
import { getMylessons } from '@/api/class.js'
import ClassGridCard from './components/ClassGridCard.vue'
import PlanDialog from './components/PlanDialog.vue'
import InlineError from '@/components/InlineError.vue'

const route = useRoute()
const router = useRouter()

/** 筛选 tab（状态落 URL query，刷新/分享不丢） */
const validTabs = ['learning', 'finished', 'expired']
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
const sortLabel = computed(() => (sort.value === 'recent' ? '最近学习 ↓' : '即将到期 ↓'))
const toggleSort = () => {
  sort.value = sort.value === 'recent' ? 'expire' : 'recent'
}

/** 课程列表 */
const allList = ref([])
const totalCount = ref(0)
const lessonStatus = ref('loading')
const lessonError = ref('')
const getMyLessonsData = async () => {
  lessonStatus.value = 'loading'
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

// 0-未学习 1-学习中 2-已学完 3-已失效
const activeCount = computed(() => allList.value.filter(it => [0, 1].includes(Number(it.status))).length)
const finishedCount = computed(() => allList.value.filter(it => Number(it.status) === 2).length)
const expiredCount = computed(() => allList.value.filter(it => Number(it.status) === 3).length)

// 「共 Z 节已学」：每门封顶后再求和（learnedSections 可能大于 sections）
const learnedTotal = computed(() => allList.value.reduce((sum, it) => {
  const total = Number(it.sections) || 0
  const learned = Number(it.learnedSections) || 0
  return sum + (total > 0 ? Math.min(learned, total) : learned)
}, 0))

const tabList = computed(() => {
  if (tab.value === 'finished') return allList.value.filter(it => Number(it.status) === 2)
  if (tab.value === 'expired') return allList.value.filter(it => Number(it.status) === 3)
  return allList.value.filter(it => [0, 1].includes(Number(it.status)))
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
    border-radius: 999px;
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
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink2);
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: var(--main);
    border-color: var(--main);
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
  border-radius: 999px;
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
  grid-template-columns: repeat(3, 1fr);
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
@media (max-width: 1200px) {
  .mcGrid {
    grid-template-columns: repeat(2, 1fr);
  }
  .mcHead {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
