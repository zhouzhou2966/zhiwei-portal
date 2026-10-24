<!--  全部课程 - 网格卡片（竖排：封面在上、信息在下、操作一行）  -->
<template>
  <div class="clsGridCard">
    <div class="clsGridCover" @click="goDetail">
      <img :src="data.courseCoverUrl" alt="">
      <!-- 已失效的课程在封面上压一层标记，光看按钮容易被误认为还能学 -->
      <span class="clsGridInvalid" v-if="data.status == 3">已失效</span>
    </div>
    <div class="clsGridBody">
      <div class="clsGridName" :title="data.courseName" @click="goDetail">{{data.courseName}}</div>
      <div class="clsGridMeta clsEllipsis">
        有效日期：{{data.expireTime == null ? '永久有效' :
          new Date(data.createTime).toLocaleDateString() + ' - ' + new Date(data.expireTime).toLocaleDateString()}}
      </div>
      <div class="clsGridMeta">
        已学习：<em>{{learnedShow}}</em> / {{data.sections}}
      </div>
      <!-- 进度条：原来的卡片只有「21 / 12」两个数字，得自己算比例，
           加一条细进度条能一眼看出学到哪儿了 -->
      <div class="clsGridBar">
        <i :style="{width: percent + '%'}"></i>
      </div>
      <div class="clsGridOps">
        <span class="clsOpMain" v-if="data.status != 3" @click="goLearning">{{learnText}}</span>
        <span class="clsOpGrey" v-if="data.status != 3 && data.planStatus == 0" @click="planActive('add')">创建计划</span>
        <span class="clsOpGrey" v-if="data.status != 3 && data.planStatus == 1" @click="planActive('edit')">修改计划</span>
        <span class="clsOpGrey" v-if="data.status == 3" @click="planActive('del')">删除课程</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  data: {
    type: Object,
    default: {}
  }
})
const emit = defineEmits(['planHandle'])
const router = useRouter()

// 0-未学习 1-学习中 2-已学完 3-已失效
const learnText = computed(() => {
  if (props.data.status == 0) return '马上学习'
  if (props.data.status == 1) return '继续学习'
  return '重新学习'
})

// 进度百分比：后端字段可能出现 已学 21 / 总 12 这种（补录或小节被删过），
// 不夹到 0~100 进度条就会溢出容器
const percent = computed(() => {
  const total = Number(props.data.sections) || 0
  const learned = Number(props.data.learnedSections) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round(learned / total * 100)))
})

// 文字也要封顶，理由同上：直接显示「已学习 21 / 12」看着像数据错乱。
// 后端 learnedSections 目前确实会大于 sections（小节被删/补录过），这里只做展示层收敛。
const learnedShow = computed(() => {
  const total = Number(props.data.sections) || 0
  const learned = Number(props.data.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
})

const goDetail = () => router.push({path: '/details/index', query: {id: props.data.courseId}})
const goLearning = () => router.push({path: '/learning/index', query: {id: props.data.courseId}})
const planActive = (type) => emit('planHandle', {data: props.data, type})
</script>
<style lang="scss" scoped>
.clsGridCard{
  background: var(--color-background5);
  border: 1px solid var(--color-font5);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.clsGridCover{
  position: relative;
  cursor: pointer;
  img{
    display: block;
    width: 100%;
    // 按课程封面的原始比例（236×132）撑开，而不是写死高度：
    // 写死高度在窄卡片上会把封面上下裁掉，封面上的课程名可能被切
    aspect-ratio: 236 / 132;
    object-fit: cover;
    background: var(--color-background3);
  }
  .clsGridInvalid{
    position: absolute;
    left: 0;
    top: 0;
    padding: 2px 10px;
    font-size: 12px;
    color: var(--color-white);
    background: rgba(26, 29, 33, .6);
    border-bottom-right-radius: 8px;
  }
}
.clsGridBody{
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.clsGridName{
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover{
    color: var(--color-main);
  }
}
.clsGridMeta{
  font-size: 12px;
  line-height: 20px;
  color: var(--color-font3);
  margin-top: 4px;
  em{
    font-style: normal;
    color: var(--color-main);
  }
}
.clsGridBar{
  height: 4px;
  border-radius: 2px;
  background: var(--color-font5);
  margin-top: 10px;
  overflow: hidden;
  i{
    display: block;
    height: 100%;
    border-radius: 2px;
    background: var(--color-main);
    transition: width .2s;
  }
}
.clsGridOps{
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  span{
    flex: 1;
    text-align: center;
    font-size: 13px;
    line-height: 30px;
    border-radius: 15px;
    cursor: pointer;
  }
  .clsOpMain{
    color: var(--color-white);
    background: var(--color-main);
    &:hover{
      background: var(--color-hover);
    }
    &:active{
      background: var(--color-active);
    }
  }
  .clsOpGrey{
    color: var(--color-font1);
    background: var(--color-background3);
    &:hover{
      color: var(--color-white);
      background: var(--color-hover);
    }
    &:active{
      color: var(--color-white);
      background: var(--color-active);
    }
  }
}
</style>
