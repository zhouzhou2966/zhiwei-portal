<!-- 学习中心侧栏 - 本周目标卡
     数据来自 useClassOverview 模块级单例（ensureOverview 已合并拉取，
     这里只读状态，不发请求 —— 同屏两份请求两份答案是明确禁止的） -->
<template>
  <div class="sidebarGoal">
    <div class="sgHead">
      <span class="sgTitle">本周目标</span>
    </div>
    <!-- 分母 0（还没定计划）显示「—」，不显示 0/0 这种没有信息量的东西 -->
    <div class="sgVal">
      <template v-if="overview.weekReady && overview.weekPlan > 0">
        <b>{{ overview.weekFinished }}</b><i>/ {{ overview.weekPlan }} 节</i>
      </template>
      <template v-else-if="overview.weekReady">—</template>
      <template v-else>-</template>
    </div>
    <div class="sgBar" v-if="overview.weekReady && overview.weekPlan > 0">
      <i :style="{ width: pct + '%' }"></i>
    </div>
    <div class="sgFoot">
      <span>连续 <b>{{ overview.signReady ? overview.streakDays : '-' }}</b> 天</span>
      <span>今日 <b>{{ overview.todayPoints != null ? overview.todayPoints : '-' }}</b> 分</span>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useClassOverview } from '../useClassOverview'

const overview = useClassOverview()

const pct = computed(() => {
  const plan = Number(overview.weekPlan) || 0
  const finished = Number(overview.weekFinished) || 0
  if (plan <= 0) return 0
  return Math.min(100, Math.round(finished / plan * 100))
})
</script>
<style lang="scss" scoped>
.sidebarGoal{
  background: #fff;
  border: 1px solid var(--color-background2);
  border-radius: 10px;
  padding: 14px 16px;
}
.sgHead{
  .sgTitle{
    font-size: 13px;
    font-weight: 600;
    color: var(--color-font1);
  }
}
.sgVal{
  margin-top: 10px;
  b{
    font-size: 26px;
    font-weight: 600;
    color: var(--color-font1);
  }
  i{
    font-style: normal;
    font-size: 12px;
    color: var(--color-font3);
    margin-left: 4px;
  }
}
.sgBar{
  margin-top: 8px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-background3);
  overflow: hidden;
  i{
    display: block;
    height: 100%;
    background: var(--color-main);
    border-radius: 2px;
  }
}
.sgFoot{
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-font3);
  b{
    font-weight: 600;
    color: var(--color-main);
  }
  // 「今日 X 分」用强调色 —— 琥珀只用于积分/打卡/到期，和全站的用色规则一致
  span:last-child b{
    color: var(--accent);
  }
}
</style>
