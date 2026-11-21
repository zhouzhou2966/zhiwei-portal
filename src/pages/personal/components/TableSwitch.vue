<!-- table切换头部 -->
<template>
  <div class="tableSwitchBar">
    <span :class="{title:true, act:actId == item.id, 'font-bt2':actId != item.id}" @click="checkHandle(item.id)" v-for="(item, index) in data" :key="index">
      {{item.name}}<em class="num" v-if="item.count > 0">{{item.count}}</em>
    </span>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
// 接收父组件数据
const props = defineProps({
  data:{
    type: Array,
    default: []
  }
})
// 定义emits
const emit = defineEmits(['changeTable'])

const actId = ref();

onMounted(() => {
  // 默认选项
  actId.value = props.data[0].id
})
// // 点击切换效果
const checkHandle = (id) => {
  actId.value = id
  emit('changeTable', id)
}

</script>
<style lang="scss" scoped>
.tableSwitchBar{
    .title{
      display: inline-block;
      font-size: 14px;
      // 原来是写死的 width:84px。「未使用 7」这种带数量的标签在 84px 里会把数字挤到换行，
      // 改成 min-width + 左右内边距：只有文字的标签宽度不变，带数字的自己撑开
      min-width: 84px;
      padding: 0 12px;
      margin-right: 20px;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
    }
    // 数量角标：不做成圆形色块，只用弱化的数字 —— tab 是导航，不是统计面板，
    // 数字的作用是「告诉你那一栏有没有东西」，不该抢标题的字重
    .num{
      margin-left: 5px;
      font-style: normal;
      font-size: 12px;
      opacity: .55;
    }
    .act{
      font-weight: 400;
      position: relative;
      background-color: var(--color-font1);
      color: #fff;
      padding: 5px 12px;
      border-radius: 28px;
      .num{
        opacity: .8;
      }
    }
  }
</style>
