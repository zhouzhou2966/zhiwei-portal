<!-- 个人中心 - 我的课程 -->
<template>
  <div class="myClassWrapper">
    <!-- 页头：退出首页 + 标题 + 一句话说明。
         原来这两颗按钮单独占一行、标题也没有，进页面第一眼不知道自己在哪。
         返回箭头已去掉：这里是一级页，没有上一级，它的 fallback 就是首页，和首页按钮重复 -->
    <div class="pageHead">
      <PageNav :back="false"/>
      <div class="pageHeadTxt">
        <h1>我的课程</h1>
        <p>接着上次的进度继续，或者挑一门新课开始</p>
      </div>
    </div>

    <!-- 最近学习：封面在左、信息在右的大卡。
         原来用 ClassCards 的 236×132 封面塞进整行，右边空一大片，
         而且进度、章节、继续学习按钮分散在三处，看不出「学到哪了」 -->
    <div class="personalCards" v-if="nowStatus === 'error'">
      <div class="secTitle">
        <h2>最近学习</h2>
      </div>
      <div class="blkLoad">
        <InlineError title="最近学习加载失败" :msg="nowError" @retry="getLearningData" />
      </div>
    </div>
    <!-- 加载中：区块标题留着（三个分支画的是同一份），数据区留白 + 延迟淡入的小字（见 .blkLoad）。
         三个接口各自独立返回，没有这个分支时第一帧就是空态（学习计划尤其明显，
         因为它初始值是空数组，会先把「还没有学习计划」渲染出来），
         等数据到了再突然变满，看着像「先错后对」。 -->
    <div class="personalCards" v-else-if="nowStatus === 'loading'">
      <div class="secTitle">
        <h2>最近学习</h2>
      </div>
      <div class="blkLoad">
        <span class="blkTip fadeInDelay">正在加载…</span>
      </div>
    </div>
    <div class="personalCards" v-else-if="learningData != null && typeof(learningData) != 'string'">
      <div class="secTitle">
        <h2>最近学习</h2>
        <span class="secSide" v-if="lastLearnText">上次学习：{{ lastLearnText }}</span>
      </div>
      <div class="hero">
        <img class="heroCover" :src="learningData.courseCoverUrl" alt=""
             @click="goLearning(learningData.courseId)">
        <div class="heroBody">
          <span class="tag">{{ statusText }}</span>
          <div class="heroName" :title="learningData.courseName"
               @click="goLearning(learningData.courseId)">{{ learningData.courseName }}</div>
          <!-- 已失效（status=3）的课不显示「学到哪一节」——它已经不能继续学了。
               后端 getNowLesson 已经过滤了失效课，这里是第二道防线 -->
          <div class="heroMeta" v-if="learningData.latestSectionName && learningData.status != 3">
            {{ learnLabel }}：第 {{ learningData.latestSectionIndex }} 节　{{ learningData.latestSectionName }}
          </div>
          <div class="heroBottom">
            <div class="barWrap">
              <div class="barTop">
                <span>课程进度</span>
                <span><b>{{ recentPercent }}%</b> · 已学 {{ learnedOf(learningData) }} / {{ learningData.sections || 0 }} 节</span>
              </div>
              <div class="bar"><i :style="{width: recentPercent + '%'}"></i></div>
            </div>
            <button class="clsBtn" type="button" @click="goLearning(learningData.courseId)">
              继续学习
              <svg viewBox="0 0 24 24"><path d="M5 12h13M13 7l5 5-5 5"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习计划 -->
    <div class="personalCards" v-if="planStatus === 'error'">
      <div class="secTitle">
        <h2>学习计划</h2>
      </div>
      <div class="blkLoad">
        <InlineError title="学习计划加载失败" :msg="planError" @retry="getPlanData" />
      </div>
    </div>
    <!-- 加载中占位：planData 初始是 null（原来给的是空数组 []，
         模板条件 `planData && ...` 对空数组为真，于是加载中就把「还没有学习计划」渲染出来了） -->
    <div class="personalCards" v-else-if="planStatus === 'loading'">
      <div class="secTitle">
        <h2>学习计划</h2>
      </div>
      <div class="blkLoad">
        <span class="blkTip fadeInDelay">正在加载…</span>
      </div>
    </div>
    <div class="personalCards" v-else-if="planData && typeof(planData) != 'string'">
      <div class="secTitle">
        <h2>学习计划</h2>
        <span class="secSide">
          <!-- 分子是「本周实际完成的小节数」（跨所有课），分母是「每周目标节数之和」，
               两者不同维度，超额完成时会出现「4 / 1」。原来写「本周计划 4 / 1」读起来
               像「计划 1 个却完成 4 个」的矛盾，改成「已学 / 目标」就说得通了 -->
          <span>本周已学 {{ weekFinishedAmount || 0 }} / 目标 {{ weekPlanAmount || 0 }}</span>
          <span>积分奖励 {{ totalPoints || 0 }}</span>
        </span>
      </div>
      <PlanTable :data="planData"></PlanTable>
    </div>

    <!-- 在学课程：只保留一行 4 门的预览入口，完整列表在独立页面。
         已失效（status=3）的课不在这里露脸 —— 它们占着「共 N 门」却点不进去学，
         让人以为还有课没上。想看/想删走「查看全部」，那里有「已失效」标签。
         原来这里把全部课程一条条往下堆，课程一多页面就长得没法看，
         而且底部的「查看全部」只是个没有点击事件的 div，点了没反应。 -->
    <div class="personalCards" v-if="lessonStatus === 'error'">
      <div class="secTitle">
        <h2>在学课程</h2>
      </div>
      <div class="blkLoad">
        <InlineError title="课程列表加载失败" :msg="lessonError" @retry="getMyLessonsData" />
      </div>
    </div>
    <!-- 加载中：数据区留白 + 延迟淡入的小字（见 .blkLoad） -->
    <div class="personalCards" v-else-if="lessonStatus === 'loading'">
      <div class="secTitle">
        <h2>在学课程</h2>
      </div>
      <div class="blkLoad">
        <span class="blkTip fadeInDelay">正在加载…</span>
      </div>
    </div>
    <div class="personalCards" v-else-if="activeCount > 0">
      <div class="secTitle">
        <h2>在学课程</h2>
        <span class="secSide">
          <span>在学 {{activeCount}} 门<em class="expTip" v-if="expiredCount > 0">· {{expiredCount}} 门已失效</em></span>
          <span class="more" @click="goAll">查看全部 →</span>
        </span>
      </div>
      <div class="clsMiniGrid">
        <div class="clsMiniCard" v-for="item in previewList" :key="item.id"
             :class="{'done': percentOf(item) >= 100}" @click="goCourse(item)">
          <div class="clsMiniCover">
            <img :src="item.courseCoverUrl" alt="">
          </div>
          <div class="clsMiniName" :title="item.courseName">{{item.courseName}}</div>
          <div class="clsMiniMeta">
            <span>已学 {{ learnedOf(item) }} / {{item.sections || 0}}</span>
            <span>{{ percentOf(item) >= 100 ? '已学完' : percentOf(item) + '%' }}</span>
          </div>
          <div class="clsMiniBar"><i :style="{width: percentOf(item) + '%'}"></i></div>
        </div>
      </div>
    </div>

    <!-- 只剩失效课程时的空态：不能因为 activeCount=0 就整块消失，
         否则用户既看不到入口，也不知道自己的课过期了 -->
    <div class="personalCards" v-else-if="expiredCount > 0">
      <div class="secTitle">
        <h2>在学课程</h2>
        <span class="secSide">
          <span class="more" @click="goAll">查看全部 →</span>
        </span>
      </div>
      <div class="clsExpTip">
        有 {{expiredCount}} 门课程已过期，可以到「全部课程」里查看或移除。
      </div>
    </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import {computed, onMounted, ref} from "vue";
// 三个区块的失败一律走区块内的 InlineError，不再弹 ElMessage（3 个请求 = 3 条 toast 叠在顶栏）
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import {errMsg, catchMsg} from '@/utils/request'
import {getMylessons, getMyPlan} from "@/api/class.js";
import {useRouter} from "vue-router";
import {dataCacheStore} from "@/store"
// 「最近学习课程」走模块级共享状态，避免和 Header 重复请求同一个接口
import {loadNowLesson} from "@/utils/nowLesson"
// 组件导入
import PlanTable from './components/PlanTable.vue'
import PageNav from './components/PageNav.vue'
import InlineError from '@/components/InlineError.vue'
import {setClassOverview} from './useClassOverview'
import {formatLearnTime} from './formatLearnTime'

const router = useRouter()
const store = dataCacheStore()

// 预览条数：一行 4 个，多了就又变成「列表堆叠」了
const PREVIEW_SIZE = 4

onMounted(() => {
  getLearningData()
  getMyLessonsData()
  getPlanData()
});

/** 方法定义 **/

// 进度百分比：sections 可能是 null（课程被删过），除零要防
const percentOf = (item) => {
  const total = Number(item && item.sections) || 0
  const learned = Number(item && item.learnedSections) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round(learned / total * 100))
}

/**
 * 「已学 X 节」的显示值。
 *
 * 后端 learnedSections 是学习记录条数，课程改过大纲之后会出现「已学 21 / 12 节」
 * 这种自相矛盾的组合（学习记录不随大纲删除而回滚）。进度条已经封顶 100%，
 * 文字也一起封顶，否则用户看到的是一个比总数还大的已完成数。
 */
const learnedOf = (item) => {
  const total = Number(item && item.sections) || 0
  const learned = Number(item && item.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
}

// 最近学习
const learningData = ref(null)
/**
 * 三个区块各自独立的三态。
 * 这页同时打三个接口（最近学习 / 学习计划 / 在学课程），原来每个失败都弹一条 toast，
 * learning 服务一挂就是 3 条叠在顶部挡住搜索框，而且 toast 3 秒就没了、用户切页回来只看到空白。
 * 现在各自在区块位置常驻一条失败提示 + 重试。
 */
const nowStatus = ref('loading')
const nowError = ref('')
const planStatus = ref('loading')
const planError = ref('')
const lessonStatus = ref('loading')
const lessonError = ref('')
const recentPercent = computed(() => percentOf(learningData.value))
// status: 0-未学习 1-学习中 2-已学完 3-已失效
const statusText = computed(() => {
  const s = Number(learningData.value && learningData.value.status)
  return s === 2 ? '已学完' : s === 3 ? '已失效' : s === 0 ? '未开始' : '正在学习'
})

/**
 * 「正在学习：第 X 节」这行的前缀。课程已经学完（status=2）时标签已经是「已学完」，
 * 再说「正在学习」自相矛盾 —— 改成「最后学习」。
 */
const learnLabel = computed(() =>
  Number(learningData.value && learningData.value.status) === 2 ? '最后学习' : '正在学习'
)

const getLearningData = async () => {
  // force=true：进「我的课程」必须拿最新进度（刚学完一节回来，TTL 内的缓存可能是旧的）；
  // 但如果 Header 已经发起了同一个请求，loadNowLesson 会复用 inFlight，不会打两次接口。
  nowStatus.value = 'loading'
  const {data, res, error} = await loadNowLesson(true)
  if (data != null) {
    learningData.value = data
    store.setMyLearnClassInfo(data)
    // 在学课程数用后端算好的 courseAmount（已排除失效课程），
    // 不再用 /lessons/page 的 total —— 那个含失效课程，两个数字会打架
    setClassOverview({courseCount: Number(data.courseAmount) || 0})
    nowStatus.value = 'ok'
    return
  }
  if (error) {
    nowError.value = '网络异常，请检查网络后重试'
    nowStatus.value = 'error'
    return
  }
  // code=200 但 data 为 null = 课表是空的，不是错误，也不该弹提示
  // （原来会走 else 分支把后端 msg「OK」弹成一条错误）
  if (res && res.code == 200) {
    learningData.value = null
    nowStatus.value = 'ok'
    return
  }
  nowError.value = errMsg(res, '最近学习加载失败')
  nowStatus.value = 'error'
}

// 学习计划
// 初始值必须是 null 而不是 []：模板条件是 `planData && typeof(planData) != 'string'`，
// 空数组是真值，加载中会先把 PlanTable 的空态「还没有学习计划」渲染出来，
// 数据到了再跳成有内容的表格 —— 用户看到的是「先错后对」。
const planData = ref(null)
const weekFinishedAmount = ref(0)
const totalPoints = ref(0)
const weekPlanAmount = ref(0)
const planParams = {
  pageNo: 1,
  pageSize: 10,
}

/**
 * 「上次学习」时间：最近学习接口（LearningLessonVO）不返回 latestLearnTime，
 * 只有学习计划里有。按 courseId 去计划里捞一条，捞不到就不显示，
 * 不编一个假时间上去。
 */
const lastLearnText = computed(() => {
  const courseId = learningData.value && learningData.value.courseId
  if (!courseId) return ''
  // planData 加载完成前是 null（见上面的定义），这里必须兜一下，否则首次渲染就 NPE
  const row = (planData.value || []).find(it => it.courseId === courseId)
  return row ? formatLearnTime(row.latestLearnTime) : ''
})

const getPlanData = async () => {
  planStatus.value = 'loading'
  try {
    const res = await getMyPlan(planParams)
    if (res && res.code == 200 && res.data != null) {
      planData.value = res.data.list || []
      weekFinishedAmount.value = res.data.weekFinished
      totalPoints.value = res.data.weekPoints
      weekPlanAmount.value = res.data.weekTotalPlan
      // 三个统计数字同时给侧边栏的「学习概览」小卡
      setClassOverview({
        weekFinished: res.data.weekFinished || 0,
        weekPlan: res.data.weekTotalPlan || 0,
        weekPoints: res.data.weekPoints || 0,
      })
      planStatus.value = 'ok'
      return
    }
    planError.value = errMsg(res, '学习计划加载失败')
    planStatus.value = 'error'
  } catch (err) {
    planError.value = catchMsg(err, '学习计划加载失败') || '请先登录后查看学习计划'
    planStatus.value = 'error'
  }
}

// 我的课程：只要前 4 条做预览
// ⚠️ 多取一些：已失效的课会被过滤掉，只取 4 条的话过滤后可能凑不满一行
const previewList = ref([])
// 课表总条数（含已失效），只用来算「另有 N 门已失效」
const count = ref(0)
const lessonParams = {
  pageNo: 1,
  pageSize: PREVIEW_SIZE * 3,
}

/**
 * 在学课程数 = 后端算好的 courseAmount（已排除失效课程）。
 * 不用 `/lessons/page` 的 total —— 那个含失效课程，Header「N 门课程」和这里会对不上。
 */
const activeCount = computed(() => Number(learningData.value && learningData.value.courseAmount) || 0)
// 已失效课程数：列表总数 - 在学数。可能为负（分页只取了前 27 条时），兜一下
const expiredCount = computed(() => Math.max(0, count.value - activeCount.value))

const getMyLessonsData = async () => {
  lessonStatus.value = 'loading'
  try {
    const res = await getMylessons(lessonParams)
    if (res && res.code == 200 && res.data != null) {
      const all = res.data.list || []
      count.value = Number(res.data.total) || 0
      // 失效课程不参与首页预览，见模板上的说明
      previewList.value = all.filter(it => Number(it.status) !== 3).slice(0, PREVIEW_SIZE)
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

// 已失效(status=3)的课程进不了学习页，改成跳详情
const goCourse = (item) => {
  if (item.status == 3) {
    router.push({path: '/details/index', query: {id: item.courseId}})
  } else {
    goLearning(item.courseId)
  }
}
const goLearning = (courseId) => router.push({path: '/learning/index', query: {id: courseId}})
const goAll = () => router.push({name: 'myClassAll'})

</script>
<style lang="scss" src="./index.scss"></style>
