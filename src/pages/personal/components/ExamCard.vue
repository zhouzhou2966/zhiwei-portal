<!-- 概览 · 最近一次考试（分数 + 正确率 + 最近 5 次趋势）
     数据：/es/exams/page 取最近 5 条（接口按时间倒序）。
     exam 服务没起时不编数据，给空态。 -->
<template>
  <div class="examCard" v-if="status === 'ok' && latest">
    <div class="exTop">
      <span class="exLabel">最近一次考试</span>
      <span class="exWhen">{{ whenText }}</span>
    </div>
    <div class="exScore">
      <b>{{ latest.score != null ? latest.score : '-' }}<i>分</i></b>
      <span>正确率 {{ latest.correctRate == null ? '--' : latest.correctRate }}%</span>
    </div>
    <p class="exName" :title="`${latest.courseName || ''} · ${latest.sectionName || ''}`">
      {{ latest.courseName || '考试' }}<template v-if="latest.sectionName"> · {{ latest.sectionName }}</template>
    </p>
    <div class="exTrend" v-if="bars.length > 1">
      <i v-for="(b, i) in bars" :key="i" :class="{ last: i === bars.length - 1 }"
         :style="{ height: b.pct + '%' }" :title="`${b.score} 分`"></i>
    </div>
    <div class="exFoot">
      <span class="fadeInDelay" v-if="status === 'ok' && bars.length > 1">最近 {{ bars.length }} 次走势</span>
      <span class="exGo" @click="$router.push({ name: 'myExam' })">全部考试 →</span>
    </div>
  </div>

  <div class="exEmpty" v-else-if="status === 'ok'">
    <p>还没有考试记录</p>
    <span>练习和小节测验在课程学习页里完成</span>
  </div>
  <div class="exState" v-else-if="status === 'error'">
    <InlineError title="考试记录加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="exState" v-else>
    <span class="exTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { getExamList } from '@/api/class.js'
import { errMsg, catchMsg } from '@/utils/request'
import { dayjs } from '@/utils/date'
import InlineError from '@/components/InlineError.vue'

const raw = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getExamList({ pageNo: 1, pageSize: 5 })
    if (res.code == 200 && res.data) {
      raw.value = res.data.list || []
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '考试记录加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '考试记录加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

const latest = computed(() => raw.value[0] || null)
const whenText = computed(() => {
  const t = latest.value && (latest.value.finishTime || latest.value.commitTime)
  return t ? dayjs(t).format('M/D HH:mm') : ''
})

/** 最近 5 次走势：接口倒序返回，反转成时间正序，柱高按 100 分归一 */
const bars = computed(() => {
  const scored = raw.value.filter(e => e.score != null).slice(0, 5).reverse()
  return scored.map(e => ({
    score: e.score,
    pct: Math.max(2, Math.min(100, Number(e.score) || 0)),
  }))
})
</script>
<style lang="scss" scoped>
.examCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.exTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.exLabel {
  font-size: 12.5px;
  color: var(--ink3);
}
.exWhen {
  font-size: 11.5px;
  color: var(--ink3);
}
.exScore {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 10px;
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 36px;
    font-weight: 400;
    line-height: 1;
    color: var(--ink);
    i {
      font-style: normal;
      font-size: 13px;
      color: var(--ink3);
      margin-left: 4px;
    }
  }
  span {
    font-size: 12px;
    color: var(--ink3);
    padding-bottom: 4px;
  }
}
.exName {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ink3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.exTrend {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 44px;
  margin-top: auto;
  padding-top: 14px;
  i {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: #C8D8E2;
    &.last {
      background: var(--main);
    }
  }
}
.exFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 11.5px;
  color: var(--ink3);
}
.exGo {
  color: var(--main);
  cursor: pointer;
  &:hover {
    color: var(--main-deep);
  }
}
.exEmpty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  min-height: 100%;
  justify-content: center;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
  span {
    font-size: 12px;
    color: var(--ink3);
  }
}
.exState {
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
.exTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
