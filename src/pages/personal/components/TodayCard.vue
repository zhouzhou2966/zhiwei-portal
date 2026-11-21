<!-- 概览 · 今日卡（今日积分 / 连续打卡 / 在学课程 + 本月打卡点阵 + 签到按钮）
     数字读 useClassOverview 单例（壳层已 ensureOverview，这里不发请求）；
     签到是唯一会写数据的动作，成功后只刷新「打卡 + 今日积分」这一对。 -->
<template>
  <aside class="todayCard">
    <div class="tdHead">
      <span>今天</span>
      <em>{{ dateText }}</em>
    </div>

    <div class="tdNums">
      <div>
        <b>{{ overview.todayPoints != null ? overview.todayPoints : '-' }}</b>
        <i>今日积分</i>
      </div>
      <div>
        <b>{{ overview.signReady ? overview.streakDays : '-' }}</b>
        <i>连续打卡</i>
      </div>
      <div>
        <b>{{ overview.courseReady ? overview.courseCount : '-' }}</b>
        <i>在学课程</i>
      </div>
    </div>

    <!-- 当月打卡点阵：10 列，行数随当月天数（31 天 = 4 行）。
         拉不到时整块不渲染（不把整月画成「未打卡」），底部统计显示「-」 -->
    <div class="tdDots" v-if="overview.signReady">
      <i v-for="(v, idx) in overview.signData" :key="idx" :class="{ on: v === 1 }"></i>
    </div>
    <div class="tdDotsEmpty" v-else></div>

    <div class="tdFoot">
      <span>本月打卡 <b>{{ signedCount }}</b> 天</span>
      <span class="tdSign" :class="{ done: todaySigned, dis: signing }" @click="sign">
        {{ todaySigned ? '今日已签到' : (signing ? '签到中…' : '签到 +积分') }}
      </span>
    </div>
  </aside>
</template>
<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { dayjs } from '@/utils/date'
import { pointsSign } from '@/api/class.js'
import { errMsg } from '@/utils/request'
import { loadSignAndPoints, useClassOverview } from '../useClassOverview'

const overview = useClassOverview()
const signing = ref(false)

const dateText = computed(() => dayjs().format('MM / DD'))
const signedCount = computed(() => (overview.signData || []).filter(v => v === 1).length)

/** 今天是否已签到：sign-records 是「本月每天 0/1」的数组，索引 0 = 1 号 */
const todaySigned = computed(() => {
  if (!overview.signReady) return false
  const idx = dayjs().date() - 1
  return overview.signData[idx] === 1
})

const sign = async () => {
  if (todaySigned.value || signing.value) return
  signing.value = true
  try {
    const res = await pointsSign()
    if (res && res.code == 200) {
      ElMessage({ message: '签到成功', type: 'success' })
      // 签到了却还显示「今日 0 分 / 未打卡」会自相矛盾，必须重拉这一对
      await loadSignAndPoints()
      return
    }
    ElMessage({ message: errMsg(res, '签到失败'), type: 'error' })
  } catch (err) {
    ElMessage({ message: '签到失败，请稍后重试', type: 'error' })
  } finally {
    signing.value = false
  }
}
</script>
<style lang="scss" scoped>
.todayCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
}
.tdHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  span {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  em {
    font-family: var(--font-serif);
    font-style: normal;
    font-size: 12px;
    letter-spacing: 1.2px;
    color: var(--ink3);
  }
}
.tdNums {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 14px;
  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 24px;
    font-weight: 400;
    line-height: 1.15;
    color: var(--ink);
  }
  div:first-child b {
    color: var(--accent);
  }
  i {
    font-style: normal;
    font-size: 11.5px;
    color: var(--ink3);
  }
}
.tdDots {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
  i {
    height: 10px;
    border-radius: 2px;
    background: #EFE6D6;
  }
  i.on {
    background: var(--accent);
  }
}
.tdDotsEmpty {
  margin-top: 16px;
  min-height: 50px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--ink3);
}
.tdFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  > span {
    font-size: 12px;
    color: var(--ink3);
  }
  b {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 400;
    color: var(--accent);
  }
}
.tdSign {
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--main);
  color: #fff;
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &:hover {
    background: var(--main-deep);
  }
  &.done {
    background: var(--accent-soft);
    color: var(--accent);
    cursor: default;
  }
  &.dis {
    opacity: .7;
    cursor: default;
  }
}
</style>
