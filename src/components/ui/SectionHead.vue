<!-- 栏目头：序号 + 标题 + 一句说明 + 右侧动作

     全站统一用它，替代原来「彩色小标题 + 更多>>」的写法。
     序号（01/02）是编排感的来源：同样的内容量，有序号的页面读起来像一本刊物，
     没序号的页面读起来像一堆模块堆叠。 -->
<template>
  <div class="secHead">
    <div class="left">
      <span v-if="index" class="zw-index idx">{{ index }}</span>
      <div class="txt">
        <h2 class="title">
          {{ title }}
          <span v-if="count" class="count">{{ count }}</span>
        </h2>
        <p v-if="subtitle" class="sub">{{ subtitle }}</p>
      </div>
    </div>

    <div v-if="action || $slots.action" class="right">
      <slot name="action">
        <span class="act" @click="$emit('action')">{{ action }}<i class="arr"></i></span>
      </slot>
    </div>
  </div>
</template>
<script setup>
defineProps({
  index: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  action: { type: String, default: '' },
  count: { type: [Number, String], default: '' }
})
defineEmits(['action'])
</script>
<style lang="scss" scoped>
.secHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.idx {
  flex: none;
  padding-bottom: 2px;
}

.title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--fs-20);
  font-weight: 600;
  letter-spacing: -0.1px;
  color: var(--color-font1);
  line-height: 1.35;
}

.count {
  font-family: var(--font-serif);
  font-size: var(--fs-13);
  font-weight: 400;
  color: var(--color-font3);
}

.sub {
  margin-top: 3px;
  font-size: var(--fs-13);
  color: var(--color-font3);
  line-height: 1.5;
}

.act {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-13);
  color: var(--color-font3);
  cursor: pointer;
  transition: color 0.18s;

  &:hover {
    color: var(--color-main);
  }
}

.arr {
  width: 5px;
  height: 5px;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}
</style>
