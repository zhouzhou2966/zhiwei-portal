<!-- 概览 · 在学课程书架（3 门 + 选课引导格）
     数据：/ls/lessons/page（pageSize=9 取一批，过滤已失效后取前 3 —— 失效课多了
     只取 3 条会凑不满一行）。自带三态。 -->
<template>
  <div class="shelf" v-if="status === 'ok' && items.length > 0">
    <div class="sCard" v-for="c in items" :key="c.id || c.courseId">
      <div class="scCover" @click="goDetail(c)">
        <img :src="c.courseCoverUrl" alt="" @error="onCoverError($event)">
        <span class="scTag">{{ tagOf(c) }}</span>
      </div>
      <div class="scBody">
        <h4 class="scName" :title="c.courseName" @click="goDetail(c)">{{ c.courseName }}</h4>
        <p class="scMeta">
          {{ c.sections || 0 }} 节 · 已学 <b>{{ learnedOf(c) }}</b>
          <template v-if="restOf(c) > 0"> · 还剩 {{ restOf(c) }}</template>
        </p>
        <div class="scBar"><i :style="{ width: percentOf(c) + '%' }"></i></div>
        <div class="scOps">
          <span class="scMain" @click="goLearn(c)">{{ learnText(c) }}</span>
          <span class="scGhost" @click="goDetail(c)">课程详情</span>
        </div>
      </div>
    </div>

    <div class="scPick" @click="$router.push('/search/index')">
      <b>去选一门新课</b>
      <em>课程首页有 300+ 门课</em>
    </div>
  </div>

  <!-- 0 门在学课：选课引导 + 推荐（推荐只在这个空态里出现，有课用户不重复给入口） -->
  <div class="shelfEmpty" v-else-if="status === 'ok'">
    <div class="scPick scPickBig" @click="$router.push('/search/index')">
      <b>还没有课程，去选一门新课</b>
      <em>课程首页有 300+ 门课</em>
    </div>
    <RecoCard />
  </div>
  <div class="scState" v-else-if="status === 'error'">
    <InlineError title="课程列表加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="scState" v-else>
    <span class="scTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMylessons } from '@/api/class.js'
import { errMsg, catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'
import RecoCard from './RecoCard.vue'

const router = useRouter()
const items = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getMylessons({ pageNo: 1, pageSize: 9 })
    if (res && res.code == 200 && res.data) {
      items.value = (res.data.list || []).filter(d => d.status != 3).slice(0, 3)
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '课程列表加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '课程列表加载失败') || '请先登录后查看'
    status.value = 'error'
  }
}
onMounted(load)

// 0-未学习 1-学习中 2-已学完 3-已失效
const tagOf = (c) => {
  const s = Number(c.status)
  if (s === 0) return '未开始'
  if (s === 2) return '已学完'
  return '学习中'
}
const learnText = (c) => {
  const s = Number(c.status)
  if (s === 0) return '马上学习'
  if (s === 2) return '重新学习'
  return '继续学习'
}
const learnedOf = (c) => {
  const total = Number(c.sections) || 0
  const learned = Number(c.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
}
const restOf = (c) => Math.max(0, (Number(c.sections) || 0) - learnedOf(c))
const percentOf = (c) => {
  const total = Number(c.sections) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(learnedOf(c) / total * 100)))
}
// 封面挂了就留同比例的色块占位，不出现破图图标
const onCoverError = (e) => {
  e.target.style.visibility = 'hidden'
}

const goDetail = (c) => router.push({ path: '/details/index', query: { id: c.courseId } })
const goLearn = (c) => router.push({ path: '/learning/index', query: { id: c.courseId } })
</script>
<style lang="scss" scoped>
.shelf {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.sCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color .2s, box-shadow .2s, transform .2s;
  &:hover {
    border-color: var(--line-strong);
    box-shadow: 0 14px 30px rgba(26, 29, 33, .08);
    transform: translateY(-2px);
  }
}
.scCover {
  position: relative;
  cursor: pointer;
  background: var(--paper);
  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
}
.scTag {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 10.5px;
  line-height: 20px;
  padding: 0 8px;
  border-radius: 5px;
  background: rgba(21, 59, 87, .82);
  color: #F3EEE2;
}
.scBody {
  padding: 13px 14px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.scName {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  &:hover {
    color: var(--main);
  }
}
.scMeta {
  margin-top: 5px;
  font-size: 12px;
  color: var(--ink3);
  b {
    font-family: var(--font-serif);
    font-size: 14px;
    font-weight: 400;
    color: var(--ink);
  }
}
.scBar {
  height: 4px;
  border-radius: 2px;
  background: var(--paper2);
  margin-top: 11px;
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    border-radius: 2px;
    background: var(--main);
  }
}
.scOps {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  span {
    flex: 1;
    height: 32px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12.5px;
    cursor: pointer;
  }
}
.scMain {
  background: var(--main);
  color: #fff;
  &:hover {
    background: var(--main-deep);
  }
}
.scGhost {
  background: var(--paper);
  color: var(--ink2);
  border: 1px solid var(--line);
  &:hover {
    color: var(--main);
    border-color: var(--main);
  }
}
.scPick {
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: #FDFCFA;
  cursor: pointer;
  min-height: 180px;
  transition: border-color .2s, background-color .2s;
  b {
    font-size: 14px;
    font-weight: 500;
    color: var(--main);
  }
  em {
    font-style: normal;
    font-size: 12px;
    color: var(--ink3);
  }
  &:hover {
    border-color: var(--main);
    background: var(--main-soft);
  }
}
.scPickBig {
  grid-column: 1 / -1;
  min-height: 150px;
}
.shelfEmpty {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 18px;
  align-items: stretch;
}
.shelfEmpty .scPickBig {
  grid-column: auto;
}
.scState {
  min-height: 320px;
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
.scTip {
  font-size: 13px;
  color: var(--ink3);
}
@media (max-width: 1200px) {
  .shelf {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
