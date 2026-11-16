<!-- 课程详情 · v40 视觉稿
     头区重构：面包屑（← 返回 / 分类）+ 320px 大封面（无暗罩）+ 信息列 + 购买卡。
     业务逻辑全部保留：详情/讲师/目录并行拉取、报名、购物车、购买、收藏、学习状态。
     正文四个面板沿用原有组件（ClassAbout / ClassCatalogue / ClassAsk / Note），只换容器与 tab 样式。 -->
<template>
  <div class="detailsWrapper">
    <div class="container">
      <div class="crumb">
        <span class="back" @click="goBack">
          <svg viewBox="0 0 16 16"><path d="M9.5 3 4.5 8l5 5M4.5 8H14" /></svg>返回
        </span>
        <span class="sep">/</span>
        <span>{{ crumbCate }}</span>
      </div>

      <div class="dt-hero">
        <div class="dt-left">
          <div class="dt-cover">
            <CourseCover
              :name="baseDetailsData.name || '课程'"
              :category="crumbCate"
              :src="baseDetailsData.coverUrl"
              ratio="16/9"
            />
          </div>
          <div class="dt-info">
            <div class="cat">{{ crumbCate }}</div>
            <h1>{{ baseDetailsData.name }}</h1>
            <p class="desc zw-clamp-3">{{ baseDetailsData.introduce || '课程介绍整理中，报名后可先看讲义与目录。' }}</p>
            <div class="dt-stats">
              <span><b class="zw-num">{{ baseDetailsData.cataTotalNum || 0 }}</b> 节</span>
              <span><b>{{ validText }}</b></span>
              <span><b class="zw-num">{{ scoreText }}</b> 评分</span>
            </div>
            <div class="dt-teacher" v-if="mainTeacher">
              <div class="av">{{ (mainTeacher.name || '师').slice(0, 1) }}</div>
              <div>
                <div class="n">{{ mainTeacher.name }}</div>
                <div class="r">{{ mainTeacher.job }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="buy">
          <div class="p" v-if="Number(baseDetailsData.price) !== 0">
            <b class="zw-num"><em>￥</em>{{ priceText }}</b>
            <span>课前随时退 · 售后有保障</span>
          </div>
          <div class="p" v-else>
            <b class="free">免费</b>
            <span>报名后立即开始学习</span>
          </div>

          <template v-if="!isSignUp">
            <template v-if="Number(baseDetailsData.price) !== 0">
              <span class="btn-main" @click="payHandle()">立即购买</span>
              <span class="btn-sub" @click="addCarts()">加入购物车</span>
            </template>
            <template v-else>
              <span class="btn-main" @click="signUpHandle">立即报名</span>
            </template>
          </template>
          <template v-else>
            <span class="btn-main" @click="goLearning">马上学习</span>
          </template>

          <div class="collect" :class="{ on: isCollection }" @click="collectionHandle">
            <i :class="{ iconfont: true, 'zhy-btn_shoucang': !isCollection, 'zhy-btn_yishoucang': isCollection }"></i>
            {{ isCollection ? '已收藏' : '收藏' }}
          </div>

          <ul>
            <li>共 {{ baseDetailsData.cataTotalNum || 0 }} 节 · {{ validText }}</li>
            <li>配套讲义与课程问答，报名后开放</li>
            <li>未开始学习随时退款</li>
          </ul>
        </div>
      </div>

      <div class="dt-body">
        <div class="mainCol">
          <div class="tabs">
            <span v-for="t in tableBar" :key="t.id" :class="{ on: actId === t.id }" @click="changeTable(t.id)">{{ t.name }}</span>
          </div>

          <div class="panel">
            <!-- 课程介绍 -->
            <ClassAbout v-show="actId == 1" :baseDetailsData="baseDetailsData" :baseClassTeacher="baseClassTeacher"></ClassAbout>
            <!-- 课程目录 -->
            <ClassCatalogue v-show="actId == 2" :data="classListData" :isSignUp="isSignUp" :id="detailsId"></ClassCatalogue>
            <!-- 问答模块 -->
            <ClassAsk v-if="isLogin() && isSignUp" v-show="actId == 3" :id="detailsId" :title="baseDetailsData.name"></ClassAsk>
            <!-- 笔记模块 -->
            <Note v-if="isLogin() && isSignUp" v-show="actId == 4" :id="detailsId"></Note>
            <!-- 用户评价 -->
            <div class="reviewEmpty" v-show="actId == 5">
              <b class="zw-num">{{ scoreText }}</b>
              <div>
                <div class="stars">★★★★★</div>
                <div class="rs">评分来自课程学习记录 · 暂无文字评价</div>
              </div>
              <p class="tip">学完本课的同学可以在「学习」页提交评价。</p>
            </div>
          </div>
        </div>

        <div class="ritCont">
          <Ask :data="askData"></Ask>
          <LikeCards :data="LikeData"></LikeCards>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
/** 数据导入 **/
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getClassDetails, getClassTeachers, getClassList } from '@/api/classDetails.js'
import { enrolledFreeCourse, putCarts } from '@/api/order.js'

import { getCourseLearning } from '@/api/class.js'
import { useRoute, useRouter } from 'vue-router'
import { dataCacheStore } from '@/store'

// 组件导入
import CourseCover from '@/components/ui/CourseCover.vue'
import ClassAbout from './components/ClassAbout.vue'
import LikeCards from './components/LikeCards.vue'
import Ask from './components/Ask.vue'
import ClassAsk from './components/ClassAsk.vue'
import Note from './components/Note.vue'
import ClassCatalogue from './components/ClassCatalogue.vue'
import { isLogin } from '@/store'
import cover1 from '@/assets/course-cover-1.svg'
import cover2 from '@/assets/course-cover-2.svg'

const route = useRoute()
const router = useRouter()
const store = dataCacheStore()

// 结果 - 详情Id
const detailsId = ref()

// 课程信息及讲师信息
const baseDetailsData = ref({})
const baseClassTeacher = ref([])
const baseClassTeacherData = ref([])

// table切换数据
const logData = [{ id: 1, name: '课程介绍' }, { id: 2, name: '课程目录' }, { id: 3, name: '问答' }, { id: 4, name: '笔记' }, { id: 5, name: '用户评价' }]
const noLogData = [{ id: 1, name: '课程介绍' }, { id: 2, name: '课程目录' }, { id: 5, name: '用户评价' }]
const tableBar = computed(() => {
  return isLogin() && isSignUp.value ? logData : noLogData
})

// 猜你喜欢 - 静态数据
const LikeData = [
  {
    id: 46000019721003770,
    name: '分布式缓存设计与实践',
    coverUrl: cover1,
    teacher: '陈老师',
    sections: 42,
    sold: 1286,
    duration: 444,
    price: 9900
  },
  {
    id: 46000019721003771,
    name: '高并发系统架构与性能调优',
    coverUrl: cover2,
    teacher: '周老师',
    sections: 56,
    sold: 934,
    duration: 512,
    price: 12900
  }
]

const isCollection = ref(false)

// 当前table选项
const actId = ref(1)

// 常见问题 - 静态数据
const askData = [
  { ask: '如何查看已购课程？', answer: '请用购课账号登录，点击【学习】进入。' },
  { ask: '课程购买后可以更换吗？', answer: '如需更换课程请咨询客服为您确认是否可以更换。' },
  { ask: '无法登录怎么办？', answer: '请更换不同浏览器。' },
  { ask: '课程过期了怎么办？', answer: '课程过期无法观看了哦，请在有效期内进行观看课程。' }
]
// 课程目录
const classListData = ref([])

/** 头区派生数据 **/
const crumbCate = computed(() => {
  const names = baseDetailsData.value.cateNames
  return (names && names.split('/').filter(Boolean).at(-1)) || '课程'
})

const priceText = computed(() => (Number(baseDetailsData.value.price) / 100).toFixed(2))
const scoreText = computed(() => {
  const s = Number(baseDetailsData.value.score) || 0
  return s > 0 ? s / 10 : '—'
})
const validText = computed(() => {
  const v = Number(baseDetailsData.value.validDuration) || 0
  return v > 99 ? '永久有效' : v ? `${v} 个月内有效` : '永久有效'
})
const mainTeacher = computed(() => baseClassTeacherData.value[0] || null)

const goBack = () => {
  router.back()
}

// mounted生命周期
onMounted(async () => {
  detailsId.value = route.query.id
  // 课程信息、讲师、目录三者互不依赖，并行拉：原来三个 await 串成一条链，
  // 首屏耗时是三个接口相加（实测 95+60+22ms），并行后只取最慢的那个。
  await Promise.all([
    getClassDetailsData(),   // 获取课程信息 - 详情
    getClassTeachersData(),  // 获取课程老师信息
    getClassListData()      // 获取课程目录
  ])
  // 学习情况必须单独串在后面：它决定 isSignUp，而 isSignUp 直接切换按钮
  if (await isLogin()) {
    await getCourseLearningData()
  }

  store.setLearingDataes({
    classDetailsData: baseDetailsData.value, // 课程的信息
    teacherData: baseClassTeacherData.value, // 讲师信息
    planData: planData.value // 学习计划信息
  })
})

/** 方法定义 **/
// 获取详情数据
const getClassDetailsData = async () => {
  await getClassDetails(detailsId.value)
    .then((res) => {
      if (res.code === 200) {
        baseDetailsData.value = res.data
      } else {
        ElMessage({
          message: errMsg(res),
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '请求出错！',
        type: 'error'
      })
    })
}

// 获取课程讲师详情数据
const getClassTeachersData = async () => {
  await getClassTeachers(detailsId.value)
    .then((res) => {
      if (res.code == 200) {
        // 过滤可展示项
        const data = res.data.filter(n => n.isShow)
        baseClassTeacherData.value = data
        let catchArr = []
        // 数据重组 展示幻灯片用
        data.forEach((n) => {
          if (catchArr.length == 0) {
            catchArr.push([n])
          } else {
            const lastTag = catchArr.at(-1)
            if (lastTag.length == 2) {
              catchArr.push([n])
            } else {
              lastTag.push(n)
              catchArr.push([n])
            }
          }
        })
        baseClassTeacher.value = catchArr
      } else {
        ElMessage({
          message: errMsg(res),
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '请求出错！',
        type: 'error'
      })
    })
}

// 获取课程目录
const getClassListData = async () => {
  await getClassList(detailsId.value)
    .then((res) => {
      if (res.code == 200) {
        classListData.value = res.data
      } else {
        ElMessage({
          message: errMsg(res),
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '课程目录数据请求出错！',
        type: 'error'
      })
    })
}
// table切换 当前展示信息 课程介绍、课程目录
const changeTable = id => {
  actId.value = id
}

//收藏
const collectionHandle = () => {
  isCollection.value = !isCollection.value
}
const isSignUp = ref(false)
// 立即报名
const signUpHandle = async () => {
  // 校验是否登录
  if (!validation()) {
    return
  }
  // 尝试报名
  await enrolledFreeCourse(detailsId.value)
    .then((res) => {
      if (res.code === 200) {
        ElMessage({
          message: '报名成功',
          type: 'success'
        })
        isSignUp.value = true
      } else {
        ElMessage({
          message: errMsg(res),
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '报名失败，请联系管理员',
        type: 'error'
      })
    })
}
// 马上学习
const goLearning = () => {
  router.push({ path: '/learning', query: { id: detailsId.value } })
}

// 查询当前用户学习的指定课程信息，返回null则代表没有购买
const planData = ref()
const getCourseLearningData = async () => {
  await getCourseLearning(detailsId.value)
    .then((res) => {
      const { data } = res
      if (res.code === 200 && data) {
        isSignUp.value = true
        planData.value = data
      } else {
        isSignUp.value = false
      }
    })
    .catch(() => {
      ElMessage({
        message: '用户学习信息数据请求出错！',
        type: 'error'
      })
    })
}
// 立即购买
const payHandle = () => {
  if (!validation()) {
    return
  }
  store.setOrderClassInfo([baseDetailsData.value])
  router.push({ path: '/pay/settlement' })
}
// 未登录处理购买、加入购物车点击问题
const validation = () => {
  if (!isLogin()) {
    ElMessageBox.confirm(
      '您还没有登录 请先去登录',
      '确认登录',
      {
        confirmButtonText: '登录购买',
        cancelButtonText: '继续浏览',
        type: 'warning'
      }
    )
      .then(() => {
        router.push({ path: '/login' })
      })
    return false
  }
  return true
}

// 加入购物车
const addCarts = () => {
  if (!validation()) {
    return
  }
  putCarts({ courseId: detailsId.value })
    .then((res) => {
      if (res.code === 200) {
        ElMessage({
          message: '已加入购物车',
          type: 'success'
        })
      } else {
        ElMessage({
          message: res.msg,
          type: 'error'
        })
      }
    })
    .catch(() => {
      ElMessage({
        message: '添加购物车请求出错！',
        type: 'error'
      })
    })
}
</script>
<style lang="scss" scoped>
.detailsWrapper {
  min-width: 1220px;
  padding-bottom: 16px;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink3);
  padding: 22px 0 0;

  .back {
    cursor: pointer;
    color: var(--ink2);
    display: inline-flex;
    align-items: center;
    gap: 7px;

    svg {
      width: 15px;
      height: 15px;
      flex: none;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.18s;
    }

    &:hover {
      color: var(--main);
    }

    &:hover svg {
      transform: translateX(-3px);
    }
  }
}

.dt-hero {
  display: grid;
  grid-template-columns: 1fr 348px;
  gap: 40px;
  padding: 26px 0 30px;
  border-bottom: 1px solid var(--line);
}

.dt-left {
  display: flex;
  gap: 26px;
  min-width: 0;
}

.dt-cover {
  width: 320px;
  flex: none;
  align-self: flex-start;
  border-radius: var(--radius-card);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--line);

  :deep(.cover) {
    border-radius: 0;
  }
}

.dt-info {
  min-width: 0;
  display: flex;
  flex-direction: column;

  .cat {
    font-size: 11.5px;
    letter-spacing: 1.2px;
    color: var(--ink3);
  }

  h1 {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.4px;
    margin: 10px 0 12px;
    color: var(--ink);
  }

  .desc {
    font-size: 13.5px;
    color: var(--ink2);
    line-height: 1.85;
    max-width: 520px;
    margin: 0;
  }
}

.dt-stats {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 18px;
  font-size: 12.5px;
  color: var(--ink3);

  b {
    font-weight: 400;
    color: var(--ink);
    font-size: 15px;
  }
}

.dt-teacher {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;

  .av {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--main-soft);
    color: var(--main);
    display: grid;
    place-items: center;
    font-size: 12px;
  }

  .n {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink);
  }

  .r {
    font-size: 12px;
    color: var(--ink3);
  }
}

.buy {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
  padding: 22px 22px 20px;
  align-self: start;
  position: sticky;
  top: 96px;
  box-shadow: 0 10px 30px rgba(26, 29, 33, 0.06);

  .p {
    display: flex;
    align-items: baseline;
    gap: 8px;

    b {
      font-variant-numeric: lining-nums tabular-nums;
      font-size: 32px;
      font-weight: 400;
      letter-spacing: -0.5px;
      color: var(--ink);

      em {
        font-style: normal;
        font-size: 17px;
        font-weight: 400;
        color: var(--ink2);
        margin-right: 3px;
      }

      &.free {
        color: var(--free);
        font-size: 26px;
      }
    }

    span {
      font-size: 12px;
      color: var(--ink3);
    }
  }
}

.btn-main {
  display: block;
  text-align: center;
  height: 44px;
  line-height: 44px;
  border-radius: 10px;
  background: var(--main);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    background: var(--main-deep);
  }
}

.btn-sub {
  display: block;
  text-align: center;
  height: 42px;
  line-height: 42px;
  border-radius: 10px;
  border: 1px solid #a89d8c;
  color: var(--ink2);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 10px;
  background: #fff;
  transition: 0.15s;

  &:hover {
    border-color: var(--main);
    color: var(--main);
    background: var(--main-soft);
  }
}

.collect {
  margin-top: 14px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink3);
  cursor: pointer;

  i {
    font-size: 14px;
    margin-right: 4px;
  }

  &.on,
  &:hover {
    color: var(--main);
  }
}

.buy ul {
  list-style: none;
  margin: 18px 0 0;
  padding: 16px 0 0;
  border-top: 1px solid var(--line);

  li {
    font-size: 12.5px;
    color: var(--ink2);
    line-height: 2;
    display: flex;
    gap: 8px;

    &::before {
      content: '';
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--line-strong);
      margin-top: 9px;
      flex: none;
    }
  }
}

.dt-body {
  padding: 26px 0 0;
  display: grid;
  grid-template-columns: 1fr 348px;
  gap: 40px;
}

.tabs {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
  color: var(--ink3);

  span {
    padding: 0 0 13px;
    cursor: pointer;
    position: relative;

    &.on {
      color: var(--ink);
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        background: var(--main);
      }
    }
  }
}

.panel {
  padding: 24px 0 40px;
}

.reviewEmpty {
  display: flex;
  align-items: center;
  gap: 16px;

  b {
    font-size: 36px;
    letter-spacing: -1px;
    color: var(--ink);
  }

  .stars {
    color: var(--accent);
    font-size: 14px;
    letter-spacing: 3px;
  }

  .rs {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 3px;
  }

  .tip {
    width: 100%;
    font-size: 12.5px;
    color: var(--ink3);
  }
}
</style>
