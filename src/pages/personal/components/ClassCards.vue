<!--  我的课程 - 卡片  -->
<template>
  <div class="classCards fx-sb fx-ct">
    <div class="marg-rt-20">
      <img :src="data.courseCoverUrl" alt="" @click="$router.push({path: '/details/index', query: {id: data.courseId}})">
    </div>
    <div class="info fx-1">
      <div class="tit ">{{data.courseName}}</div>
      <div>
        <span>有效日期：</span>
        {{data.expireTime == null ? '永久有效' :
          new Date(data.createTime).toLocaleDateString() + ' - ' + new Date(data.expireTime).toLocaleDateString()}}
      </div>
      <div><span>已学习：</span><em>{{ learnedOf }}</em> / {{data.sections}}</div>
      <!-- 后端 latestSectionName 为 null（从没学过 / 大纲删过那一节）时整行不渲染，
           原来没有这层判断，会显示「正在学习：第 节 undefined」 -->
      <div v-if="type == '1' && data.latestSectionName && data.status != 3">
        <span>{{ learnLabel }}：</span>第{{data.latestSectionIndex}}节 {{data.latestSectionName}}
      </div>
    </div>
    <div class="btnCont">
      <div class="btn" v-if="type == '1'" @click="() => $router.push({path: '/learning/index', query: {id: data.courseId}})">
        <span class="bt bt-round">继续学习</span>
      </div>
      <div class="btn" v-if="type == '2' && data.status != 3" @click="() => $router.push({path: '/learning/index', query: {id: data.courseId}})">
        <span class="bt bt-round" v-if="data.status == 0">马上学习</span>
        <span class="bt bt-round" v-if="data.status == 1">继续学习</span>
        <span class="bt bt-round" v-if="data.status == 2">重新学习</span>
      </div>
      <div class="btn" v-if="type == '2' && data.status != 3 && data.planStatus == 0" @click="planActive(data, 'add')">
        <span class="bt-grey bt-round">创建计划</span>
      </div>
      <div class="btn" v-if="type == '2' && data.status != 3 && data.planStatus == 1" @click="planActive(data, 'edit')">
        <span class="bt-grey bt-round">修改计划</span>
      </div>
      <div class="btn" v-if="type == '2' && data.status == 3" @click="planActive(data, 'del')">
        <span class="bt-grey bt-round">删除课程</span>
      </div>
    </div> 
  </div>
</template>
<script setup>
import { computed } from 'vue'

// 接收父组件传来的标题
const props = defineProps({
  data:{
    type: Object,
    default: {}
  },
  type:{
    type: String,
    default: '1'
  }
})
const emit = defineEmits(['planHandle'])

/**
 * 已学小节数要封顶到课程总节数。
 * learnedSections 是学习记录条数，课程改过大纲之后会出现「已学 23 / 12 节」
 * 这种自相矛盾的组合（学习记录不随大纲删除而回滚），不封顶用户会以为数据坏了。
 */
const learnedOf = computed(() => {
  const total = Number(props.data && props.data.sections) || 0
  const learned = Number(props.data && props.data.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
})

/**
 * 「学到哪一节」这行的前缀，按 status 分：0-未学习 1-学习中 2-已学完 3-已失效。
 * 原来只判了 2，失效课程会显示成「正在学习」。
 */
const learnLabel = computed(() => {
  const s = Number(props.data && props.data.status)
  if (s === 2) return '最后学习'
  if (s === 0) return '还未学习'
  if (s === 3) return '已失效'
  return '正在学习'
})

const planActive = (it, type) => {
  emit('planHandle', {data: it, type})
}

</script>
<style lang="scss" scoped>
.classCards{
  img{
    width: 236px;
    height: 132px;
    border-radius: 8px;
  }
  .info{
    line-height: 30px;
    font-size: 14px;
    em{
      font-style: normal;
      color: var(--color-main);
    }
    span{
      display: inline-block;
      color: var(--color-font3);
      min-width: 85px;
    }
    .tit{
      font-size: 20px;
      font-weight: 500;
      line-height: 40px;
    }
  }
  
  .btnCont{
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
     .btn{
        width: 114px;
        height: 40px;
        display: flex;
        align-items: center;
        margin: 10px 0;
      }
  }
  
}
</style>
