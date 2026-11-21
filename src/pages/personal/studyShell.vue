<!-- 学习中心新壳（v2）
     与 /account 的旧壳（personal/index.vue）完全分开：
     旧壳是「左导航 + 右内容」，这个壳是「顶部 tab + 全宽内容」，两边互不影响。
     tab 由当前路由 matched[1].children 派生（与 LeftNav 同一套逻辑），
     新增二级页时不用改这个文件。
     概览数据（本周/连续/今日）由本壳统一 ensureOverview 拉一次，
     子页面只读 useClassOverview 的状态，禁止各自再打一遍。 -->
<template>
  <div class="studyShell">
    <div class="ssBarWrap">
      <div class="container ssBar">
        <nav class="ssTabs">
          <router-link v-for="item in navItems" :key="item.name" :to="toOf(item)"
                       class="ssTab" :class="{ on: isActive(item) }">{{ item.meta.title }}</router-link>
        </nav>
        <div class="ssMeta">
          <span>本周 <b>{{ weekText }}</b></span>
          <i class="sep"></i>
          <span class="accent">连续 <b>{{ signText }}</b> 天</span>
          <i class="sep"></i>
          <span>今日 <b>{{ pointsText }}</b> 分</span>
        </div>
      </div>
    </div>

    <div class="ssMain">
      <div class="container ssInner">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ensureOverview, useClassOverview } from './useClassOverview'

const route = useRoute()
const overview = useClassOverview()

/** tab 项：用当前区的子路由清单，hidden 的不出现在 tab 里 */
const navItems = ref([])
const syncNav = () => {
  const shell = route.matched[1]
  navItems.value = shell ? shell.children.filter(n => n.meta && !n.meta.hidden && n.name) : []
}
watch(() => route.matched[1], syncNav, { immediate: true })

// 高亮取 meta.active（「全部课程」这种二级页仍高亮父项），与 LeftNav 口径一致
const activeKey = computed(() => route.meta.active || route.path.split('/').at(-1))
const isActive = (item) => item.meta.active === activeKey.value
const toOf = (item) => ({ name: item.name })

/** 本周进度 / 打卡 / 积分：没就绪时显示「-」，不摆 0 冒充真实值 */
const weekText = computed(() => {
  if (!overview.weekReady) return '-'
  if (!overview.weekPlan) return '未设目标'
  return `${overview.weekFinished}/${overview.weekPlan} 节`
})
const signText = computed(() => (overview.signReady ? overview.streakDays : '-'))
const pointsText = computed(() => (overview.todayPoints != null ? overview.todayPoints : '-'))

onMounted(ensureOverview)
watch(() => route.fullPath, ensureOverview)
</script>
<style lang="scss" scoped>
.studyShell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

/* 顶部 tab 条：白底 + 一条 1px 线，sticky 不需要（滚动的是 ssMain） */
.ssBarWrap {
  flex: none;
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.ssBar {
  height: 64px;
  display: flex;
  align-items: stretch;
}
.ssTabs {
  display: flex;
  align-items: stretch;
  gap: 34px;
  min-width: 0;
}
.ssTab {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: var(--ink2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  transition: color .18s;
  &:hover {
    color: var(--ink);
  }
  &.on {
    color: var(--ink);
    font-weight: 600;
    border-bottom-color: var(--main);
  }
}
.ssMeta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12.5px;
  color: var(--ink3);
  b {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 400;
    color: var(--ink);
    margin: 0 2px;
  }
  .accent,
  .accent b {
    color: var(--accent);
  }
  .sep {
    width: 1px;
    height: 12px;
    background: var(--line-strong);
  }
}

/* 主区：整页唯一滚动容器 */
.ssMain {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #fff;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-background4);
    border-radius: 4px;
    &:hover {
      background: var(--color-font4);
    }
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
.ssInner {
  min-height: 100%;
  padding: 28px 0 64px;
}
</style>
