<!--  全部课程 - 网格卡片（竖排：封面在上、信息在下、操作一行）  -->
<template>
  <div class="clsGridCard">
    <div class="clsGridCover" @click="goDetail">
      <img :src="data.courseCoverUrl" alt="">
      <!-- 状态标签：「我的课程」有在学/未开始/已学完/已失效四个 tab，同一 tab 下
           所有卡的状态都一样，标签只是把 tab 又说一遍 → show-tag=false 关掉。
           但**已失效例外**：那张卡按钮也变「删除课程」，没有标签容易被当成还能学。 -->
      <span class="clsGridTag" v-if="showTag || Number(data.status) === 3" :class="tagClass">{{ tagText }}</span>
    </div>
    <div class="clsGridBody">
      <div class="clsGridName" :title="data.courseName" @click="goDetail">{{data.courseName}}</div>
      <!-- 有效期：7 天内到期时换成「有效期至 X · N 天后到期」并转暖色。
           课程过期后不可再学、没学完的节也不计入进度，这条是卡片上最该被看见的坏消息 -->
      <div class="clsGridMeta clsEllipsis" :class="{ 'is-soon': expiringSoon }">
        <template v-if="expiringSoon">
          有效期至 {{ fmtDay(data.expireTime) }} · {{ daysLeft === 0 ? '今天到期' : daysLeft + ' 天后到期' }}
        </template>
        <template v-else>
          有效日期：{{data.expireTime == null ? '永久有效' :
            new Date(data.createTime).toLocaleDateString() + ' - ' + new Date(data.expireTime).toLocaleDateString()}}
        </template>
      </div>
      <div class="clsGridMeta">
        已学习：<em>{{learnedShow}}</em> / {{data.sections}}
        <template v-if="rest > 0"> · 还剩 {{ rest }} 节</template>
      </div>
      <!-- 进度条：原来的卡片只有「21 / 12」两个数字，得自己算比例，
           加一条细进度条能一眼看出学到哪儿了 -->
      <div class="clsGridBar">
        <i :style="{width: percent + '%'}"></i>
      </div>
      <div class="clsGridOps">
        <span class="clsOpMain" v-if="data.status != 3" @click="goLearning">{{learnText}}</span>
        <!-- 计划按钮依赖父级的 PlanDialog：概览页等没有承接弹窗的页面传 plan-ops=false 隐藏 -->
        <template v-if="planOps">
          <span class="clsOpGrey" v-if="data.status != 3 && data.planStatus == 0" @click="planActive('add')">创建计划</span>
          <span class="clsOpGrey" v-if="data.status != 3 && data.planStatus == 1" @click="planActive('edit')">修改计划</span>
          <span class="clsOpGrey" v-if="data.status == 3" @click="planActive('del')">删除课程</span>
        </template>
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
  },
  // 是否显示「创建/修改计划」按钮（依赖父级承接 planHandle 事件）。
  // 我的课程/全部课程页 = true；学习概览页没有计划弹窗，传 false
  planOps: {
    type: Boolean,
    default: true
  },
  // 是否显示封面上的状态标签。
  // 「我的课程」按状态分了 tab，标签与 tab 重复 → 传 false；
  // 「全部课程」是混在一起的列表 → 保持 true
  showTag: {
    type: Boolean,
    default: true
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

// 封面左上角状态标签：四个状态都给，卡片的「能不能学」一眼可见
const tagText = computed(() => {
  const s = Number(props.data.status)
  if (s === 3) return '已失效'
  if (s === 2) return '已学完'
  if (s === 1) return '学习中'
  return '未开始'
})
const tagClass = computed(() => {
  const s = Number(props.data.status)
  if (s === 3) return 'invalid'
  if (s === 2) return 'done'
  if (s === 1) return 'doing'
  return 'todo'
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

// 「还剩 N 节」：学习中心所有课程卡都讲这个口径，不再让用户自己减
const rest = computed(() => Math.max(0, (Number(props.data.sections) || 0) - learnedShow.value))

/** 距到期天数（向上取整）；没到期时间 / 时间非法返回 null（永久有效） */
const daysLeft = computed(() => {
  const t = props.data.expireTime
  if (!t) return null
  const end = new Date(t).getTime()
  if (Number.isNaN(end)) return null
  return Math.ceil((end - Date.now()) / 86400000)
})
/** 7 天内到期才提示。已失效（status 3）不提示 —— 它已经过期了，不是「将要」 */
const expiringSoon = computed(() => {
  const d = daysLeft.value
  return Number(props.data.status) !== 3 && d !== null && d >= 0 && d <= 7
})
const fmtDay = (t) => {
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`
}

const goDetail = () => router.push({path: '/details/index', query: {id: props.data.courseId}})
const goLearning = () => router.push({path: '/learning/index', query: {id: props.data.courseId}})
const planActive = (type) => emit('planHandle', {data: props.data, type})
</script>
<style lang="scss" scoped>
// v2 卡片语言：白底 + 1px 米线 + 16 圆角，hover 才上浮加阴影
.clsGridCard{
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color .2s, box-shadow .2s, transform .2s;
  &:hover{
    border-color: var(--line-strong);
    box-shadow: 0 14px 30px rgba(26, 29, 33, .08);
    transform: translateY(-2px);
  }
}
.clsGridCover{
  position: relative;
  cursor: pointer;
  background: var(--paper);
  img{
    display: block;
    width: 100%;
    // 按课程封面的原始比例（236×132）撑开，而不是写死高度：
    // 写死高度在窄卡片上会把封面上下裁掉，封面上的课程名可能被切
    aspect-ratio: 236 / 132;
    object-fit: cover;
  }
  .clsGridTag{
    position: absolute;
    left: 10px;
    top: 10px;
    padding: 0 9px;
    line-height: 21px;
    font-size: 11px;
    color: #F3EEE2;
    background: rgba(21, 59, 87, .82);
    border-radius: 5px;
    &.done{
      background: rgba(46, 125, 111, .88);
    }
    &.todo{
      background: rgba(200, 137, 47, .9);
    }
    &.invalid{
      background: rgba(26, 29, 33, .72);
    }
  }
}
.clsGridBody{
  padding: 15px 18px 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.clsGridName{
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -.1px;
  line-height: 22px;
  color: var(--ink);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover{
    color: var(--main);
  }
}
.clsGridMeta{
  font-size: 12px;
  line-height: 20px;
  color: var(--ink3);
  margin-top: 4px;
  /* 即将到期：只把这一行转暖，不动整张卡 —— 卡片还要能正常读、正常点 */
  &.is-soon{
    color: #B07C22;
    font-weight: 500;
  }
  em{
    font-style: normal;
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--ink);
  }
}
.clsGridBar{
  height: 5px;
  border-radius: 3px;
  background: var(--paper2);
  margin-top: 12px;
  overflow: hidden;
  i{
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--main);
    transition: width .2s;
  }
}
.clsGridOps{
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  span{
    flex: 1;
    text-align: center;
    font-size: 13px;
    line-height: 34px;
    // 卡内操作按钮 8px 圆角（全 pill 会变成「每个元素都是胶囊」）
    border-radius: 8px;
    cursor: pointer;
    transition: background-color .18s, color .18s, border-color .18s;
  }
  .clsOpMain{
    color: #fff;
    background: var(--main);
    &:hover{
      background: var(--main-deep);
    }
  }
  .clsOpGrey{
    color: var(--ink2);
    background: var(--paper);
    border: 1px solid var(--line);
    &:hover{
      color: var(--main);
      border-color: var(--main);
    }
  }
}
</style>
