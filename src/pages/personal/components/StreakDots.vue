<!-- 学习中心侧栏 - 当月打卡点阵
     列数固定 10，行数 = ceil(当月天数 / 10)（31 天 = 4 行）——
     写死 3 行的话 31 天的月份会缺最后一天。
     数据来自 useClassOverview 单例；接口失败时 signReady 为 false，点阵整块隐藏，
     不把整月画成「未打卡」——那是在编数据 -->
<template>
  <div class="streakDots" v-if="overview.signReady">
    <div class="sdHead">
      <span class="sdTitle">本月打卡</span>
      <span class="sdStat">{{ signedCount }} 天 · 连续 {{ overview.streakDays }} 天</span>
    </div>
    <div class="sdGrid">
      <i v-for="(v, idx) in overview.signData" :key="idx" :class="{ on: v === 1 }"></i>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useClassOverview } from '../useClassOverview'

const overview = useClassOverview()
const signedCount = computed(() => overview.signData.filter(v => v === 1).length)
</script>
<style lang="scss" scoped>
.streakDots{
  background: #fff;
  border: 1px solid var(--color-background2);
  border-radius: 10px;
  padding: 14px 16px;
}
.sdHead{
  display: flex;
  align-items: center;
  justify-content: space-between;
  .sdTitle{
    font-size: 13px;
    font-weight: 600;
    color: var(--color-font1);
  }
  .sdStat{
    font-size: 11px;
    color: var(--color-font3);
  }
}
.sdGrid{
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  i{
    height: 9px;
    border-radius: 2px;
    background: #efe6d6;
  }
  // 已打卡：琥珀。全站用色规则 —— 琥珀只表达积分/打卡/到期
  i.on{
    background: var(--accent);
  }
}
</style>
