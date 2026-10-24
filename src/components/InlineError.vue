<!--
  区块内的「加载失败」提示。

  为什么不用 ElMessage：
  ① toast 3 秒就消失，用户切页回来只看到一块空白，不知道这里加载失败过；
  ② 一个页面常常有 3 个请求（积分页 = 打卡记录 + 今日积分 + 学霸榜，
     我的课程 = 最近学习 + 学习计划 + 在学课程），服务一挂就是 3 条 toast 叠在顶部，
     正好挡住搜索框（实测截图里就是这样）；
  ③ 面板常驻在数据该出现的位置，还能带一个「重新加载」。

  版式（2026-10-23 按 yyt 要求改）：标题 → 原因 → 按钮 竖排居中，
  和「我的优惠券 / 我的订单」页的 .errBox 保持一致；原因统一加全角括号。
-->
<template>
  <div class="inlineErr">
    <p class="title">{{ title }}</p>
    <p class="msg" v-if="msg">（{{ msg }}）</p>
    <el-button v-if="retry" type="primary" plain size="small" @click="$emit('retry')">重新加载</el-button>
  </div>
</template>
<script setup>
defineProps({
  // 出错的区块名，例如「学习计划加载失败」
  title: { type: String, default: '加载失败' },
  // 后端给的原始原因（如「服务不存在」），没有就不显示这一行
  msg: { type: String, default: '' },
  retry: { type: Boolean, default: true },
})
defineEmits(['retry'])
</script>
<style lang="scss" scoped>
.inlineErr{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
  background: var(--color-background5);
  border-radius: 8px;
  .title{
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: var(--color-font1);
  }
  .msg{
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 20px;
    color: var(--color-font2);
    word-break: break-all;
  }
}
</style>
