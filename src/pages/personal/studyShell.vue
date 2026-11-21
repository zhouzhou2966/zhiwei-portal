<!-- 学习中心新壳（v2 · 固定侧栏 + 独立滚动内容）
     与 /account 的旧壳（personal/index.vue）完全分开：旧壳是「左导航 + 右内容」，
     这个壳是「固定侧栏 + 内容区自己滚」，两边互不影响。
     导航项由路由 matched[1].children 派生（与 LeftNav 同一套逻辑），
     hidden 路由（全部课程、考试详情）不上导航；高亮取 meta.active。
     <1200px 时侧栏隐藏，降级成内容区顶部的横向 tab（同一份路由数据渲染）。 -->
<template>
  <div class="ss">
    <div class="ssWrap">
      <aside class="ssSide">
        <div class="ssBrand">
          <i class="ssDot"></i>
          <div class="ssBrandTxt">
            <b>学习中心</b>
            <span>第 {{ weekNo }} 周</span>
          </div>
        </div>

        <div class="ssGroup" v-for="(g, gi) in navGroups" :key="gi">
          <p class="ssGroupLabel" v-if="gi > 0 && g.label">{{ g.label }}</p>
          <router-link v-for="item in g.items" :key="item.name" :to="{ name: item.name }"
                       class="ssNav" :class="{ on: isActive(item) }">
            <span>{{ item.meta.title }}</span>
            <em v-if="item.name === 'myClass' && overview.courseReady">{{ overview.courseCount }}</em>
          </router-link>
        </div>

        <!-- 本周目标：侧栏唯一一块凹陷底，周进度的数字只在这里出现一次 -->
        <div class="ssGoal">
          <div class="sgHead">
            <span>本周目标</span>
            <b>{{ overview.weekReady && overview.weekPlan ? overview.weekPlan + ' 节' : '未设置' }}</b>
          </div>
          <div class="sgVal">
            <template v-if="overview.weekReady && overview.weekPlan > 0">
              <b>{{ overview.weekFinished }}</b><i>/ {{ overview.weekPlan }} 节</i>
            </template>
            <template v-else-if="overview.weekReady">—</template>
            <template v-else>-</template>
          </div>
          <div class="sgBar" v-if="overview.weekReady && overview.weekPlan > 0">
            <i :style="{ width: goalPct + '%' }"></i>
          </div>
          <div class="sgFoot">
            <span>连续 <b>{{ overview.signReady ? overview.streakDays : '-' }}</b> 天</span>
            <span>今日 <b>{{ overview.todayPoints != null ? overview.todayPoints : '-' }}</b> 分</span>
          </div>
        </div>

        <SidebarSign></SidebarSign>
      </aside>

      <div class="ssMain">
        <!-- 窄屏降级：横向 tab -->
        <nav class="ssTabs">
          <router-link v-for="item in flatNav" :key="item.name" :to="{ name: item.name }"
                       class="ssTab" :class="{ on: isActive(item) }">{{ item.meta.title }}</router-link>
        </nav>
        <div class="ssContent">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dayjs } from '@/utils/date'
import { ensureOverview, useClassOverview } from './useClassOverview'
import SidebarSign from './SidebarSign.vue'

const route = useRoute()
const overview = useClassOverview()
const weekNo = dayjs().isoWeek()

/** 分组写死：学习（概览/课程/考试）、复盘（报告/笔记） */
const NAV_GROUP = {
  personalOverview: '学习',
  myClass: '学习',
  myExam: '学习',
  learningReport: '复盘',
  learningNotes: '复盘',
}

const navItems = ref([])
const syncNav = () => {
  const shell = route.matched[1]
  navItems.value = shell
    ? shell.children.filter(n => n.meta && !n.meta.hidden && n.name)
    : []
}
watch(() => route.matched[1], syncNav, { immediate: true })

// 按 NAV_GROUP 分组；没配到的路由落到「其他」，不会丢
const navGroups = computed(() => {
  const order = ['学习', '复盘', '其他']
  const map = new Map()
  navItems.value.forEach((item) => {
    const label = NAV_GROUP[item.name] || '其他'
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(item)
  })
  return order.filter(l => map.has(l)).map(label => ({ label, items: map.get(label) }))
})
// 第一组不显示分组标题（顶部就是「学习中心」品牌行）
const firstGroupHasLabel = computed(() => (navGroups.value[0] || {}).label === '学习')

const flatNav = computed(() => navItems.value)

const activeKey = computed(() => route.meta.active || route.path.split('/').at(-1))
const isActive = (item) => item.meta.active === activeKey.value

const goalPct = computed(() => {
  const plan = Number(overview.weekPlan) || 0
  const done = Number(overview.weekFinished) || 0
  if (plan <= 0) return 0
  return Math.min(100, Math.round(done / plan * 100))
})

onMounted(ensureOverview)
watch(() => route.fullPath, ensureOverview)
</script>
<style lang="scss" scoped>
.ss {
  display: flex;
  min-height: 0;
  height: 100%;
  /* 学习中心整块白底：外层 layoutsWrapper.personalBg 的雾蓝渐变只留给登录页等场景，
     这里铺白才能和设计稿一致（侧栏与内容区同底，靠一条竖线分区） */
  background: #fff;
}
.ssWrap {
  display: flex;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  min-height: 0;
}

/* ============ 侧栏（固定，不随内容滚） ============ */
.ssSide {
  width: 240px;
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 24px 34px 26px 0;
  border-right: 1px solid var(--line);
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--line-strong);
    border-radius: 3px;
  }
}
.ssBrand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px 20px;
}
.ssDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--main);
  flex: none;
}
.ssBrandTxt {
  display: flex;
  align-items: baseline;
  gap: 8px;
  b {
    font-size: 15.5px;
    font-weight: 600;
    letter-spacing: -.1px;
    color: var(--ink);
  }
  span {
    font-family: var(--font-serif);
    font-size: 11px;
    letter-spacing: .6px;
    color: var(--ink3);
  }
}
.ssGroup {
  margin-top: 16px;
  &:first-of-type {
    margin-top: 0;
  }
}
.ssGroupLabel {
  padding: 0 12px 7px;
  font-size: 10.5px;
  letter-spacing: 1.4px;
  color: var(--ink3);
}
.ssNav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  height: 40px;
  padding: 0 12px;
  border-radius: 9px;
  font-size: 14px;
  color: var(--ink2);
  transition: background-color .16s, color .16s;
  &:hover {
    background: var(--paper);
    color: var(--ink);
  }
  &.on {
    background: var(--main-soft);
    color: var(--main);
    font-weight: 600;
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: 11px;
      bottom: 11px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--main);
    }
    em {
      color: var(--main);
      opacity: .7;
    }
  }
  span {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  em {
    font-style: normal;
    font-family: var(--font-serif);
    font-size: 12px;
    color: var(--ink3);
  }
}

/* 本周目标卡 */
.ssGoal {
  margin-top: auto;
  margin-bottom: 10px;
  background: var(--paper);
  border-radius: 12px;
  padding: 15px 16px 14px;
}
.sgHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  span {
    font-size: 12px;
    color: var(--ink2);
  }
  b {
    font-family: var(--font-serif);
    font-size: 12px;
    font-weight: 400;
    color: var(--ink3);
  }
}
.sgVal {
  margin-top: 7px;
  display: flex;
  align-items: baseline;
  gap: 5px;
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 30px;
    font-weight: 400;
    line-height: 1;
    color: var(--ink);
    letter-spacing: -1px;
  }
  i {
    font-style: normal;
    font-size: 12px;
    color: var(--ink3);
  }
}
.sgBar {
  margin-top: 10px;
  height: 4px;
  border-radius: 2px;
  background: #E9E2D4;
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    border-radius: 2px;
    background: var(--main);
  }
}
.sgFoot {
  margin-top: 11px;
  padding-top: 10px;
  border-top: 1px dashed #E1D9C9;
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--ink3);
  b {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: 400;
    color: var(--accent);
    margin-left: 2px;
  }
}

/* ============ 内容区（独立滚动） ============ */
.ssMain {
  flex: 1;
  min-width: 720px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-left: 34px;
}
.ssContent {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 0 56px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--line-strong);
    border-radius: 3px;
    &:hover {
      background: var(--color-font4);
    }
  }
}

/* 顶部横向 tab：窄屏降级用，宽屏隐藏 */
.ssTabs {
  display: none;
  gap: 30px;
  padding: 0 0 0 2px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.ssTab {
  display: flex;
  align-items: center;
  height: 52px;
  font-size: 14.5px;
  color: var(--ink2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  &.on {
    color: var(--ink);
    font-weight: 600;
    border-bottom-color: var(--main);
  }
}

@media (max-width: 1200px) {
  .ssSide {
    display: none;
  }
  /* 窄屏没有侧栏的留白，内容区自己给左右边距，否则标题会贴着屏幕边缘 */
  .ssWrap {
    padding: 0 24px;
  }
  .ssMain {
    min-width: 0;
    padding-left: 0;
  }
  .ssTabs {
    display: flex;
  }
  .ssContent {
    padding-top: 20px;
  }
}
</style>
