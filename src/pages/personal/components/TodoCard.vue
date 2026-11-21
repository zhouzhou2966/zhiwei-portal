<!-- 概览 · 今天要做的（待办 + 即将到期合并）
     数据：/ls/lessons/todo（后端整体 try/catch，任何异常都返回空结构）。
     计划缺口和到期课是同一件事的两种紧迫度，合成一张卡，只占一个位置。 -->
<template>
  <div class="todoCard" v-if="status === 'ok' && items.length > 0">
    <div class="tdRow" v-for="(item, i) in items" :key="i">
      <span class="tdDot" :class="{ due: item.due }"></span>
      <span class="tdTxt">
        {{ item.text }}
        <em v-if="item.sub">{{ item.sub }}</em>
      </span>
      <span class="tdGo" @click="item.go()">{{ item.action }} →</span>
    </div>
  </div>

  <div class="tdEmpty" v-else-if="status === 'ok'">
    <p>今天没有待办，保持节奏就好</p>
  </div>
  <div class="tdState" v-else-if="status === 'error'">
    <InlineError title="待办加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="tdState" v-else>
    <span class="tdTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getLearningTodo } from '@/api/learningStat'
import { loadNowLesson } from '@/utils/nowLesson'
import { errMsg, catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
const raw = ref(null)
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getLearningTodo()
    if (res.code == 200 && res.data) {
      raw.value = res.data
      status.value = 'ok'
      return
    }
    // 网关 code:0（后端没上/服务不存在）→ 按空态处理，不把「服务不存在」甩给用户
    errorMsg.value = errMsg(res, '待办加载失败')
    status.value = res && res.code == 0 ? 'ok' : 'error'
    if (status.value === 'ok') raw.value = null
  } catch (err) {
    errorMsg.value = catchMsg(err, '待办加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

// 待办项组装：计划缺口（gap>0 才有）+ 到期课程（N 天后到期；0 天 = 今天到期）
const items = computed(() => {
  const data = raw.value
  if (!data) return []
  const list = []
  const gap = data.planGap
  if (gap && gap.gap > 0) {
    list.push({
      due: false,
      text: `本周计划还差 ${gap.gap} 节`,
      sub: '可以通过调整周目标放宽节奏',
      action: '去学习',
      go: async () => {
        // 借 nowLesson 缓存拿最近课程的 courseId（概览页已经拉过，零额外请求）
        const { data: lesson } = await loadNowLesson()
        if (lesson && lesson.courseId) {
          router.push({ path: '/learning/index', query: { id: lesson.courseId } })
        } else {
          router.push('/search/index')
        }
      },
    })
  }
  ;(data.expiring || []).slice(0, 3).forEach((c) => {
    list.push({
      due: true,
      text: c.daysLeft === 0
        ? `「${c.courseName || '课程'}」今天到期`
        : `「${c.courseName || '课程'}」${c.daysLeft} 天后到期`,
      sub: '到期后课程不可再学',
      action: '查看课程',
      go: () => router.push({ path: '/details/index', query: { id: c.courseId } }),
    })
  })
  return list
})
</script>
<style lang="scss" scoped>
.todoCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 4px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}
.tdRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px dashed var(--line);
  &:last-child {
    border-bottom: none;
  }
}
.tdDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--main);
  flex: none;
  &.due {
    background: var(--accent);
  }
}
.tdTxt {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  color: var(--ink);
  em {
    display: block;
    margin-top: 3px;
    font-style: normal;
    font-size: 11.5px;
    color: var(--ink3);
  }
}
.tdGo {
  flex: none;
  font-size: 12.5px;
  color: var(--main);
  cursor: pointer;
  &:hover {
    color: var(--main-deep);
  }
}
.tdEmpty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 46px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--ink3);
}
.tdState {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.tdTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
