<!-- 全站统一的统计行：标签居左、衬线数值居右（可带单位、可选副行说明）。
     报告页趋势侧栏 / 本期概况 / 概览学习报告摘要共用这一形态，
     改这里的样式 = 全站统计卡一起变，不要再各写一套 -->
<template>
  <div class="statRow">
    <div class="srMain">
      <span class="srLabel">{{ label }}</span>
      <span class="srVal"><b>{{ value }}</b><i v-if="unit" class="srUnit">{{ unit }}</i></span>
    </div>
    <div v-if="sub" class="srSub">{{ sub }}</div>
  </div>
</template>
<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '-' },
  unit: { type: String, default: '' },
  sub: { type: String, default: '' },
})
</script>
<style lang="scss" scoped>
.statRow {
  padding: 9px 0;
  /* 相邻统计行之间用淡虚线分隔（同组件实例共享 scope，兄弟选择器可用） */
  & + .statRow {
    border-top: 1px dashed var(--line);
  }
}
.srMain {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.srLabel {
  font-size: 12.5px;
  color: var(--ink3);
  white-space: nowrap;
}
.srVal {
  white-space: nowrap;
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 20px;
    font-weight: 400;
    line-height: 1.1;
    color: var(--ink);
  }
  i {
    font-style: normal;
    font-size: 11px;
    color: var(--ink3);
    margin-left: 3px;
  }
}
.srSub {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--ink3);
}
</style>
