<!-- table切换头部 -->
<template>
  <div class="integralRankTab">
    <div class="item head fx-sb">
      <span>排名</span> <span class="ct">姓名</span> <span>积分</span>
    </div>
    <!-- 加载中不在这里画骨架：父级三态里 loading 走的是 .blkLoad（数据区留白 + 延迟淡入小字），
         这个组件只在「已经拿到结果」时才被渲染，所以不需要 loading 分支。
         原来那 5 行灰条的问题：接口 20~80ms 就返回，灰条只活 1~3 帧就被错误卡顶掉，
         一整块灰「啪」地缩成三个小方块，比留白更晃眼。 -->
    <div class="item myItem fx-sb" v-if="hasMyRow">
      <span>{{ data.rank || '--' }}</span>
      <span class="ct">我</span>
      <span>{{ data.points || '--'  }}</span>
    </div>
    <div v-if="data.boardList">
      <div
        class="item fx-sb"
        v-for="(item, index) in data.boardList"
        :key="index"
      >
        <img v-if="index <= 2" :src="ranking(index + 1)" alt="" />
        <span class="lt" v-else>{{ ranking(index + 1) }}</span>
        <span class="ct">{{ item.name || "--" }}</span>
        <span>{{ item.points }}</span>
      </div>
    </div>
    <div class="onData" v-else>
      <Empty ></Empty>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import rank1 from "@/assets/icon_rank1.png";
import rank2 from "@/assets/icon_rank2.png";
import rank3 from "@/assets/icon_rank3.png";
import Empty from "@/components/Empty.vue";

// 前三名图片展示
const ranks = [rank1, rank2, rank3];
const ranking = (num) => {
  let val = num;
  if (num <= 3) {
    val = ranks[num - 1];
  }
  return val;
};
// 接收父组件数据
const props = defineProps({
  data: {
    type: Object,
    default: [],
  },
  type:{ // 控制表格最后一样是否有线条展示 固定高度的有的 非固定没有 默认 有
    type: Boolean,
    default: false
  }
});

/**
 * 是否显示「我」这一行。
 * 该赛季没有任何数据时后端只回空对象（rank/points 都是 null），
 * 这时再挂一行「我 -- --」纯属噪音，直接让下面只显示空状态。
 */
const hasMyRow = computed(() => {
  const d = props.data || {};
  const hasBoard = Array.isArray(d.boardList) && d.boardList.length > 0;
  return hasBoard || !!d.rank || !!d.points;
});
</script>
<style lang="scss" scoped>
// 榜单：去掉 Excel 式全边框表格，改成虚线分隔的轻量行。
// 我的积分页和天梯榜页共用这个组件，两处一起换装
.integralRankTab {
  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
    min-height: 44px;
    font-weight: 400;
    font-size: 14px;
    color: var(--color-font1);
    border-bottom: 1px dashed var(--color-background2);
    img {
      width: 30px;
      height: 30px;
    }
    span:first-child {
      display: inline-block;
      text-align: center;
      width: 44px;
      font-size: 13px;
      color: var(--color-font2);
    }
    span:last-child {
      display: inline-block;
      text-align: center;
      width: 44px;
      font-size: 13px;
      color: var(--color-font1);
      font-weight: 500;
    }
    .ct {
      flex: 1;
      display: inline-block;
      text-align: center;
      width: 120px;
    }
  }
  .item:last-child {
    border-bottom: none;
  }
  .head {
    min-height: 40px;
    font-size: 12px;
    font-weight: 400;
    color: var(--color-font3);
    border-bottom: 1px solid var(--color-background2);
    span{
      color: inherit;
      font-size: 12px;
      font-weight: 400;
    }
  }
  .myItem {
    background: var(--color-main-light);
    border-radius: 8px;
    color: var(--color-main);
    border-bottom: none;
    span:first-child,
    span:last-child{
      color: var(--color-main);
      font-weight: 600;
    }
  }
  .onData{
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    min-height: 160px;
  }
}
.fxTab{
  .item:last-child{
    border-bottom: none;
  }
}
</style>
