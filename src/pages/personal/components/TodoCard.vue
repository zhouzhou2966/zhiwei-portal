<!-- 概览 · 今天要做的（只列到期课程）
     数据：/ls/lessons/todo 的 expiring 字段。
     planGap（计划缺口）刻意不进待办：它是周进度的第二种说法，
     周进度只在侧栏目标卡出现一次（改造方案 §6.1）。 -->
<template>
  <div class="todoCard" v-if="status === 'ok' && items.length > 0">
    <div class="tdRow" v-for="(item, i) in items" :key="i">
      <span class="tdDot"></span>
      <span class="tdTxt">
        「{{ item.courseName || '课程' }}」{{ item.daysLeft === 0 ? '今天到期' : item.daysLeft + ' 天后到期' }}
        <em>到期后课程不可再学，没学完的节数不再计入进度</em>
      </span>
      <span class="tdGo" @click="goCourse(item)">查看课程 →</span>
    </div>
  </div>

  <div class="tdEmpty" v-else-if="status === 'ok'">
    <p>近期没有到期的课程</p>
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

// 只有到期课程一类，最多 3 条（后端已按到期时间升序）
const items = computed(() => ((raw.value && raw.value.expiring) || []).slice(0, 3))
const goCourse = (c) => router.push({ path: '/details/index', query: { id: c.courseId } })
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
