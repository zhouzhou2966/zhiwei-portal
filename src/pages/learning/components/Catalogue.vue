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
        <!-- .row 是整行的内容块（图标 + 标题 + 练习/试看 + 时长），用 inline-flex 让它按内容取宽、
             再由父级 text-align: center 居中；时间轴虚线挂在 .row 上，所以永远跟着图标走。 -->
        <div class="subTitle" :class="isPlay(item.id, it)"  v-for="it in item.sections" :key="it.id" >
          <div class="row">
            <i  @click="play(it, it.type == 2 ? 1 :it.type)" :class="startIcon(it)"></i>
            <div class="subTit">
              <span @click="play(it, it.type == 2 ? 1 : it.type == 2 ? 1 :it.type)" class="marg-rt-10">{{it.name}}</span>
              <span v-if="it.hasTest" @click="play(it, it.type == 2 ? 2 :it.type)" class="chapter">练习</span>
              <span v-if="it.trailer" class="trailer-font">试看</span>
            </div>
            <div class="dur">
              <span @click="play(it, it.type == 2 ? 1 :it.type)" v-if="it.mediaDuration != 0">{{durationFormat(it.mediaDuration)}}</span>
            </div>
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
  // 左边 10px、右边 16px。
  // 为什么左边不是 16：上一层 `.cont` 有 15px、页签那层 `.pd-lr-10` 又有 10px，
  // 「目录 / 问答 / 笔记」的文字实际落在 25px；这里若也用 16，章名和图标列会落到 31px，
  // 和页签差 6px，看着像没对齐。改成 10 之后三者共用一条左边线（章名 = 图标列 = 页签）。
  padding: 0 16px 0 10px;

  /* 把 element-plus collapse 的默认配色压回「深色面板」这一套。
     原来只写了一条 `::deep(.el-collapse-item__header){background:transparent}`：
       ① `::deep` 是双冒号，不是 Vue 的 `:deep()` 语法，这条规则编译后根本匹配不到元素；
       ② 就算写成 `:deep`，也只盖了 header，没盖内容区 `__wrap`。
     于是 `el-collapse-item__wrap` 用回 element-plus 默认的
     `background-color: var(--el-collapse-content-bg-color)`（= `--el-fill-color-blank` = #fff），
     深色面板里就出现一整块白底；再叠加 `.subTitle:hover{color:#fff}` ⇒ 白字白底，整行「消失」。
     全局兜底写在 src/style/element/index.scss，但按需引入后该组件 CSS 被拆成独立 chunk，
     由路由懒加载「后插入」，同特异性下后加载者胜 ⇒ 全局覆盖失效。
     这里用 scoped `:deep()`，编译成 `.catalogueWrapper[data-v-x] .el-collapse-item__wrap`，
     特异性高于 element-plus 的 (0,1,0)，与加载顺序无关，不会再被反超。 */
  :deep(.el-collapse) {
    border-top: none;
    border-bottom: none;
  }

  :deep(.el-collapse-item__header) {
    background: transparent;
    // 章名要浅色：header 默认色是 --el-collapse-header-text-color（#303133），白底上才看得见
    color: #E6E6E6;
    border-bottom: none;
  }

  :deep(.el-collapse-item__wrap) {
    background: transparent;
    border-bottom: none;
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
    // 章名左对齐：原来 text-align:center 是为了配合「整行居中」那版目录，
    // 现在小节已经按 grid 列宽左对齐了，章名再居中就和下面的图标列错开、看着散。
    // 左对齐后章名和图标列共用同一条左边线（都是 .catalogueWrapper 的 16px padding）。
    text-align: left;

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
    // 居中只作兜底（.row 自带 margin:0 auto）；真正的对齐交给 .row 的 grid 列宽。
    text-align: center;

    line-height: 20px;

    .row {
      // 原来是 `inline-flex` + 「按内容取宽」：每行内容宽度都不一样（有的带「试看」、有的没时长），
      // 整块再靠 text-align 居中 ⇒ 图标一行的位置就一行的位置（实测三列起点 112/140/170），
      // 看着像时间轴散了。改成固定列宽的 grid：所有行宽度一致，图标 / 标题 / 试看 / 时长各占一列，跨行对齐。
      display: grid;
      grid-template-columns: 16px minmax(0, 1fr) 46px;
      align-items: center;
      column-gap: 4px;
      width: 100%;
      margin: 0 auto;
      position: relative;
      text-align: left;

      // 时间轴虚线。原来是 `.subTitle ::after`（带空格 = 后代选择器，实际落在 .subTit 上），
      // 定位相对 .subTitle 左边 7px —— 整行一居中就和图标脱节了。
      // 改挂到 .row 上：.row 的左边缘就是图标所在列，虚线自然跟着图标走。
      &::after {
        content: '';
        position: absolute;
        left: 7px;
        top: 21px;
        height: 18px;
        border-left: 1px dashed #667280;
      }
    }

    // 最后一行不画向下的虚线
    &:last-child .row::after {
      display: none;
    }

    i {
      position: relative;
      z-index: 2;
      top: 1px;
      // 列间距交给 .row 的 column-gap，这里不再用 margin
      justify-self: center;
    }

    cursor: pointer;
    margin: 5px 0 20px 0;
    color: #A0A9B2;

    .subTit {
      // 二级 grid：标题占满剩余宽度，「试看 / 练习」固定 52px 一列。
      // 关键点：即使某行没有试看，那一列也留着 —— 否则标题宽度随行变化，右端的时长又会对不齐。
      display: grid;
      grid-template-columns: minmax(0, 1fr) 52px;
      align-items: center;
      column-gap: 6px;
      min-width: 0;
      line-height: 20px;

      > span:first-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chapter,
      .trailer-font {
        justify-self: start;
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

  // 时长列：固定 46px 一列、右对齐。grid 里列宽已经固定，这里只负责右对齐。
  .dur {
    text-align: right;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 5px;
  }

  .subTitle:last-child {
    margin-bottom: 0;

    .row::after {
      display: none;
    }
  }

  .playAct {
    // 「正在播放」这一行。原来用 --color-main（#1B4B6B），在 #1B2127 深底上对比度只有 ~1.9:1，
    // 基本看不见 —— 之前目录内容区被 element-plus 的默认白底盖住，才「碰巧」读得出来。
    // 深底恢复后必须换成浅色，用主题里现成的浅主色，保持「蓝 = 当前」的语义，又不至于像纯白（和 hover 撞色）。
    .row::after {
      border-color: var(--color-main-light2);
    }

    color: var(--color-main-light2);

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
