<!-- 首页 · 今日待办条

     原来这三类信息全在个人中心二级页里（计划在「我的课程」、考试在「我的考试」、
     券在「我的优惠券」），首页一次都看不到。用户要「有事可做」，先得让事可见。

     四格都是「数字 + 一句去向」，点击直达对应页面；签到是唯一在原地完成的动作，
     所以只有它做成按钮形态，其余三格保持「看一眼就够」的克制。 -->
<template>
  <div class="taskDock">
    <!-- ① 签到：唯一可以在首页直接完成的动作 -->
    <div class="cell sign" :class="{ done: tasks.signed }">
      <div class="cellMain">
        <span class="label">每日签到</span>
        <span class="value" v-if="!tasks.signed">+{{ tasks.signPoints || 5 }} 积分</span>
        <span class="value done" v-else>今日已签</span>
      </div>
      <button
        class="signBtn"
        type="button"
        :disabled="tasks.signed || signing"
        @click="$emit('sign')"
      >{{ tasks.signed ? '已打卡' : (signing ? '签到中' : '去签到') }}</button>
    </div>

    <!-- ② 本周计划：进度用「已学 / 目标」，两个词各就各位 -->
    <div class="cell" @click="$router.push('/personal/main/myClass')">
      <span class="label">本周计划</span>
      <span class="value">
        <template v-if="tasks.planReady">{{ tasks.planDone }}<i>/ {{ tasks.planTotal }}</i></template>
        <template v-else>-</template>
      </span>
      <span class="hint">节</span>
    </div>

    <!-- ③ 待考：0 场时不要做成「有 0 件事要做」的噪音，弱化成灰色 -->
    <div class="cell" :class="{ mute: !tasks.examCount }" @click="$router.push('/personal/main/myExam')">
      <span class="label">待考试</span>
      <span class="value">{{ tasks.examReady ? tasks.examCount : '-' }}<i v-if="tasks.examReady">场</i></span>
      <span class="hint">{{ tasks.examCount ? '去看看' : '暂无' }}</span>
    </div>

    <!-- ④ 可领券：直接告诉用户「还有几张能薅」，比只放一个入口有说服力 -->
    <div class="cell" :class="{ mute: !tasks.couponCount }" @click="$router.push('/main/coupon')">
      <span class="label">可领优惠券</span>
      <span class="value">{{ tasks.couponReady ? tasks.couponCount : '-' }}<i v-if="tasks.couponReady">张</i></span>
      <span class="hint">{{ tasks.couponCount ? '去领取' : '暂无' }}</span>
    </div>
  </div>
</template>
<script setup>
defineProps({
  // { signed, signPoints, planReady, planDone, planTotal, examReady, examCount, couponReady, couponCount }
  tasks: { type: Object, default: () => ({}) },
  // 签到请求进行中：挡住连点，后端会按日去重但前端不该把请求发出去
  signing: { type: Boolean, default: false }
})
defineEmits(['sign'])
</script>
<style lang="scss" scoped>
.taskDock {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr 1fr;
  margin-top: 16px;
  background: #fff;
  border: 1px solid #EDE7DB;
  border-radius: 14px;
  overflow: hidden;
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-height: 88px;
  padding: 0 20px;
  cursor: pointer;
  transition: background-color .18s;

  /* 竖分隔线用左侧边框，第一条不要 */
  & + .cell {
    border-left: 1px solid #F2EDE3;
  }

  &:hover {
    background: #FCFAF6;
  }

  /* 0 场 / 0 张：整格降透明度，避免「有事要做」的误读 */
  &.mute {
    .value {
      color: var(--color-font3);
    }

    .hint {
      color: var(--color-font4);
    }
  }
}

.label {
  font-size: 12px;
  color: var(--color-font3);
}

.value {
  font-size: 22px;
  font-weight: 600;
  line-height: 26px;
  color: var(--color-font1);

  i {
    margin-left: 2px;
    font-style: normal;
    font-size: 12px;
    font-weight: 400;
    color: var(--color-font3);
  }
}

.hint {
  font-size: 12px;
  color: var(--color-font3);
}

/* 签到格：横排「文案 + 按钮」，跟其余三格纵向排版拉开差异 */
.sign {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: default;

  &:hover {
    background: #fff;
  }
}

.cellMain {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  .value {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-warning);
  }
}

.signBtn {
  flex: none;
  height: 34px;
  padding: 0 16px;
  font-size: 13px;
  color: #12374F;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #EBCB84, #D9A441);
  cursor: pointer;
  transition: opacity .18s, transform .18s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    color: var(--color-font3);
    background: #F2EDE3;
    cursor: default;
  }
}

/* 已签到：整格降饱和，不要再抢「继续学习」的注意力 */
.sign.done .cellMain .value {
  color: var(--color-font2);
  font-weight: 400;
}
</style>
