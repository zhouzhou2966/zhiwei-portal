<!-- 概览 · 继续学习 Hero（深蓝大卡）
     数据走 @/utils/nowLesson（5s TTL + inFlight 合并），禁止直接打 /ls/lessons/now。
     自带三态：加载中显示同尺寸的空占位，失败给重试，无课给选课引导。 -->
<template>
  <div class="continueHero" v-if="status === 'ok' && lesson && lesson.status != 3">
    <div class="chInfo">
      <!-- 左上角原来有个「继续学习」小标签，删掉了：右下角按钮已经承担了这个语义
           （未开始=马上学习 / 学习中=继续学习 / 已学完=重新学习），
           同一张卡上说两遍反而让人以为卡片和按钮是两件事。 -->
      <!-- 不挂原生 title：这张卡是整个页面的主角，课程名用 21px 大字号完整显示，
           hover 再弹一个同名的黑提示框只是重复。真要截断也是字号自适应，不是靠 tooltip -->
      <h2 class="chName" @click="goLearn">{{ lesson.courseName }}</h2>
      <p class="chNext" v-if="lesson.latestSectionName">
        上次学到 · 第 {{ lesson.latestSectionIndex }} 节 {{ lesson.latestSectionName }}
      </p>
      <div class="chBar"><i :style="{ width: percent + '%' }"></i></div>
      <div class="chRow">
        <span class="chMeta">
          已学 <b>{{ learnedShow }}</b> / {{ lesson.sections || 0 }} 节
          <template v-if="rest > 0"> · 还剩 {{ rest }} 节</template>
        </span>
        <span class="chBtn" @click="goLearn">{{ btnText }} →</span>
      </div>
    </div>
    <div class="chCover" @click="goLearn">
      <img :src="lesson.courseCoverUrl" alt="" @error="coverBroken = true">
    </div>
  </div>

  <!-- 空态：没有在学的课 -->
  <div class="chEmpty" v-else-if="status === 'ok'">
    <p>还没有在学的课程</p>
    <span class="chBtnGhost" @click="$router.push('/search/index')">去选一门课 →</span>
  </div>
  <div class="chState" v-else-if="status === 'error'">
    <InlineError title="最近学习加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="chState" v-else>
    <span class="chTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadNowLesson } from '@/utils/nowLesson'
import { catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
const lesson = ref(null)
const status = ref('loading')
const errorMsg = ref('')
const coverBroken = ref(false)

const load = async () => {
  status.value = 'loading'
  try {
    // force=true：从播放页学完一节回来，TTL 缓存里的旧进度不能要
    const { data } = await loadNowLesson(true)
    lesson.value = data
    status.value = 'ok'
  } catch (err) {
    errorMsg.value = catchMsg(err, '最近学习加载失败') || '请先登录后查看'
    status.value = 'error'
  }
}
onMounted(load)

// 0-未开始 1-学习中 2-已学完 3-已失效（失效课整卡不渲染）
const btnText = computed(() => {
  const s = lesson.value && lesson.value.status
  if (s === 0) return '马上学习'
  if (s === 2) return '重新学习'
  return '继续学习'
})

const percent = computed(() => {
  const total = Number(lesson.value && lesson.value.sections) || 0
  const learned = Number(lesson.value && lesson.value.learnedSections) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(learned / total * 100)))
})
// learnedSections 可能大于 sections（课程改过大纲），展示层封顶
const learnedShow = computed(() => {
  const total = Number(lesson.value && lesson.value.sections) || 0
  const learned = Number(lesson.value && lesson.value.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
})
const rest = computed(() => {
  const total = Number(lesson.value && lesson.value.sections) || 0
  return Math.max(0, total - learnedShow.value)
})

const goLearn = () => {
  // ⚠️ /ls/lessons/now 的 VO 没有 sectionId，只传 courseId，播放页自己定位最近小节
  router.push({ path: '/learning/index', query: { id: lesson.value.courseId } })
}
</script>
<style lang="scss" scoped>
.continueHero {
  display: flex;
  gap: 26px;
  align-items: stretch;
  padding: 24px 26px;
  border-radius: 16px;
  color: #F3EEE2;
  background: linear-gradient(135deg, #1E5375 0%, #153B57 100%);
  box-shadow: 0 10px 26px rgba(21, 59, 87, .14);
  overflow: hidden;
}
.chInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.chName {
  /* 上面原来还压着一行 kicker，删掉之后标题就是卡片第一行，
     不再需要给它让位的 margin */
  margin-top: 0;
  // 卡片宽度会随着分栏变化，标题字号跟着收
  font-size: clamp(17px, 1.9vw, 21px);
  font-weight: 600;
  letter-spacing: -.2px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}
.chNext {
  margin-top: 7px;
  font-size: 13px;
  color: rgba(243, 238, 226, .68);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chBar {
  margin-top: auto;
  height: 5px;
  max-width: 460px;
  border-radius: 3px;
  background: rgba(255, 255, 255, .16);
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: #E8C98A;
  }
}
.chRow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.chMeta {
  font-size: 12px;
  color: rgba(243, 238, 226, .6);
  b {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 400;
    color: #fff;
  }
}
.chBtn {
  margin-left: auto;
  height: 34px;
  padding: 0 20px;
  border-radius: 999px;
  background: #fff;
  color: var(--main);
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .12);
  &:hover {
    background: #F3EEE2;
  }
}
.chCover {
  // 宽度跟容器走：概览首屏 8:4 分栏时这张卡只有 ~530px，
  // 固定 286px 会把文字区挤到 175px（课程名截断、进度条竖向换行）
  width: clamp(120px, 28%, 286px);
  flex: none;
  cursor: pointer;
  // 让盒子贴合图片自身比例：align-self:center 取消拉伸，img 高度交给图片原生比例。
  // 只要 img 有固定高度（哪怕 contain），宽高比不合就会露出上下蓝边（用户已否过）
  align-self: center;
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
    background: rgba(255, 255, 255, .08);
    box-shadow: 0 10px 24px rgba(0, 0, 0, .26);
  }
}
.chEmpty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  p {
    font-size: 14px;
    color: var(--ink2);
  }
}
.chBtnGhost {
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
.chState {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.chTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
