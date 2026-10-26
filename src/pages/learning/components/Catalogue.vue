<!-- 学习目录 -->
<template>
  <div class="catalogueWrapper">
    <!-- 去掉 accordion：原来一次只能展开一章，点开第二章第一章就自动收起。
         现在允许多章同时展开，配合下面 actIndex 的初始值 = 全部章节，进页面就是全展开的目录。 -->
    <el-collapse v-model="actIndex">
      <el-collapse-item :name="item.id" v-for="item in data" :key="item.id">
        <template #title>
          <div class="title"><span class="ft-wt-600">{{item.name}}</span></div>
        </template>
        <div class="subTitle fx-sb" :class="isPlay(item.id, it)"  v-for="it in item.sections" :key="it.id" >
          <i  @click="play(it, it.type == 2 ? 1 :it.type)" :class="startIcon(it)"></i>
          <div class="subTit fx-1">
            <span @click="play(it, it.type == 2 ? 1 : it.type == 2 ? 1 :it.type)" class="marg-rt-10">{{it.name}}</span>
            <span v-if="it.hasTest" @click="play(it, it.type == 2 ? 2 :it.type)" class="chapter">练习</span>
            <span v-if="it.trailer" class="trailer-font">试看</span>
          </div>
          <div class="dur"> 
            <span @click="play(it, it.type == 2 ? 1 :it.type)" v-if="it.mediaDuration != 0">{{durationFormat(it.mediaDuration)}}</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script setup>
import { ref, watch, watchEffect, inject } from 'vue'
import { dataCacheStore } from "@/store"
import { ElMessage, ElMessageBox } from "element-plus";
// 目录右侧的时长标签，统一走这个格式化函数（"4:24" / "1:02:03"）
import { durationFormat } from "@/utils/tool";
const store = dataCacheStore()
// 引入父级传参
const props = defineProps({
  data:{
    type: Array,
    default:[]
  },
  statusList:{
    type: Array,
    default:[]
  },
  playId:{
    type: String,
    default: ''
  },
  finished: {
    type: Boolean,
    default: false
  },
  // 已考完的小节id集合（字符串数组），用于给练习/考试节点打勾
  finishedSections: {
    type: Array,
    default: () => []
  }
})


const currentPlayData = inject('currentPlayData')
// 默认打开项
const playId = ref(props.playId)
const finished = ref(props.finished)

/**
 * 展开的章节。
 *
 * 去掉 accordion 之后 el-collapse 的 v-model 变成数组（元素是各章 name，也就是 item.id），
 * 允许多章同时展开。这里初始值给「全部章节」= 进页面目录就是全展开的。
 *
 * ⚠️ 必须用 watch 而不是 onMounted：chapters 是父组件异步拉的，
 * 本组件挂载时 props.data 还是空数组，onMounted 里算出来的必然是空。
 * （原来那段 onMounted 还有个 bug：`for (let c in props.data)` 里 c 是索引字符串，
 *   写 c.sections 会抛 undefined，只是因为空数组没进循环才没暴露。）
 */
const actIndex = ref([])
watch(
  () => props.data,
  (list) => {
    actIndex.value = (list || []).map(c => c.id)
  },
  { immediate: true }
)

watchEffect(() => {
  playId.value = currentPlayData.sectionId || props.playId
  if(props.finished){
    next();
  }
})
// 展开章、节
const isPlay = (chapterId, section) => {
  let b = playId.value === section.id;
  if(b){
    openItem(chapterId);
  }
  return {playAct: b}
}

// 根据播放状态调整icon
const startIcon = (item) => {
  let data = 'iconfont zhy-a-ico-sp-sei2x'

  if(item.type == '2'){
    if(item.finished != undefined && item.finished == false){  // 未播放完成
      data = 'iconfont zhy-a-ico-502x1'
    } else if(item.finished && item.finished == true){ // 播放完成
      data = 'iconfont zhy-a-ico-wc2x'
    } else {
      // 注意：这里原来写的是裸块 `} {`，会无条件把上面两个分支的结果覆盖掉，
      // 导致视频图标永远显示「未播放」，改成 else 分支
      data = 'iconfont zhy-a-ico-sp-sei2x' // 未播放过
    }
  } else if(item.type == '3'){
    // 考试节点：考过了打「完成」勾，没考过显示考试图标
    data = isSectionFinished(item) ? 'iconfont zhy-a-ico-wc2x' : 'iconfont zhy-a-ico-jdks2x'
  }
  return data
}

// 该小节是否已考完（id 统一按字符串比，雪花id在前端是字符串）
const isSectionFinished = (item) => {
  return props.finishedSections.some(id => String(id) === String(item.id))
}

// emit数据载入
const emit = defineEmits(['sortHandle', 'playHadle', 'openCatalogue'])
const openItem = val => {
  emit('openCatalogue', val)
}
// 排序选中参数定义
const activeKey = ref('all')

// 点击小节 type == 1 是点击视频 2 点击练习
const play = (item, tp) => {
  playId.value = item.id
  emit('playHadle', {item, tp})
}
const next = () => {
  let findNext = false;
  let item;
  let cs = props.data;
  a:for (let i = 0; i < cs.length; i++) {
    let ss = cs[i].sections;
    for (let j = 0; j < ss.length; i++) {
        if(findNext){
          item = ss[i];
          break a;
        }
        if(ss[i].id === playId.value){
          findNext = true
        }
    }
  }
  if(!item || item.type === 3){
    emit('playHadle', {item, tp: 0})
    return
  }
  playId.value = item.id
  emit('playHadle', {item, tp: 1})
}
</script>
<style lang="scss" scoped>
.catalogueWrapper {
  padding: 0 10px;

  ::deep(.el-collapse-item__header) {
    background: transparent;
  }

  .title {
    font-size: 16px;
    height: 40px;
    line-height: 40px;
    // 原来写死 280px：目录面板在全宽/窄屏下章名后面会空一大块。
    // 改成撑满剩余宽度，章名过长时省略（min-width: 0 是 flex 子项能收缩出省略号的前提）
    flex: 1;
    min-width: 0;
    overflow: hidden;

    span {
      display: block;
      height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .subTitle {
    position: relative;

    ::before {
      position: relative;
      z-index: 2;
    }

    ::after {
      content: '';
      position: absolute;
      left: 7px;
      top: 21px;
      border-left: 1px dashed #667280;
      height: calc(100% - 2px);
    }

    line-height: 20px;

    i {
      position: relative;
      top: 1px;
      margin-right: 4px;
    }

    cursor: pointer;
    margin: 5px 0 20px 0;
    color: #A0A9B2;

    .subTit {
      // 原来写死 230px、内容又是行内左对齐 ⇒ 标题短的行右边空一大截（时长那列只有 20 多 px）。
      // 改成 flex：标题撑满剩余宽度，练习/试看贴到右边，和时长对齐成一列。
      width: auto;
      min-width: 0;
      display: flex;
      align-items: center;
      line-height: 20px;

      > span:first-child {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chapter,
      .trailer-font {
        flex: none;
      }

      .chapter {
        display: inline-block;
        width: 32px;
        text-align: center;
        line-height: 15.5px;
        font-weight: 400;
        font-size: 12px;
        border-radius: 2px;
        background: #A0A9B2;
        color: #1B2127;
      }
    }

    &:hover {
      color: #fff;

      .chapter {
        background: #ffffff !important;
        color: #1B2127 !important;
      }
    }

  }

  // 时长列：固定占位 + 右对齐。原来没时长时这块宽度是 0，
  // 有/没有时长的行右端对不齐，看着像「有的行空有的行不空」。
  .dur {
    flex: none;
    min-width: 46px;
    text-align: right;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 5px;
  }

  .subTitle:last-child {
    margin-bottom: 0;

    ::after {
      display: none;
    }
  }

  .playAct {
    ::after {
      border-color: var(--color-main);
    }

    color: var(--color-main);

    .chapter {
      background: var(--color-main) !important;
      color: #FFFFFF !important;
    }
  }
  .trailer-font{
    padding: 3px 12px;
    font-size: 12px;
    //background: var(--color-error3);
    border-radius: 12px;
    color: var(--color-error);
    font-weight: 700;
    line-height: 20px;
  }
}
</style>
