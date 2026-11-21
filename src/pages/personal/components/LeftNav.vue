<!-- 侧栏导航（学习中心 /personal 与 个人中心 /account 共用组件）
     学习中心：三段式 —— ① 顶部标识（学习中心 / 第 N 周）② 纯文字导航 ③ 本周目标卡 + 打卡点阵
     个人中心：头像卡 + 图标导航（无数据卡 —— 学习语义不进个人中心）
     导航项由「当前路由 matched[1].children」派生（syncNav），两个区零复制 -->
<template>
  <div class="LeftNav">
    <!-- 个人中心：用户卡。学习中心这侧不要头像 —— 「在学 N 门」是最像个人中心的一行 -->
    <div class="meCard" v-if="isAccount">
      <img v-if="userIcon" class="meAvatar" :src="userIcon" alt="" @error="iconBroken = true">
      <div v-else class="meAvatar meAvatarTxt">{{ initial }}</div>
      <div class="meInfo">
        <div class="meName">{{ userName }}</div>
      </div>
    </div>
    <!-- 学习中心：顶部标识 -->
    <div class="brandCard" v-else>
      <p class="brandTitle">学习中心</p>
      <p class="brandWeek">第 {{ weekNo }} 周</p>
    </div>

    <!-- 导航：/account 带图标，/personal 纯文字 + 左侧竖条高亮 -->
    <nav class="nav">
      <router-link class="navItem" :class="{'on': activeClass(item)}" v-for="item in personalRoute"
                   :key="item.path" :to="toOf(item)">
        <svg class="i" v-if="isAccount" viewBox="0 0 24 24" v-html="iconOf(item.name)"></svg>
        <span>{{item.meta.title}}</span>
      </router-link>
    </nav>

    <!-- 学习中心数据区：本周目标 + 当月打卡。/account 下不显示 —— 学习语义不进个人中心 -->
    <SidebarGoal v-if="!isAccount"></SidebarGoal>
    <StreakDots v-if="!isAccount"></StreakDots>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from '@/utils/date'
import { useUserStore } from '@/store'
import { ensureOverview } from '../useClassOverview'
import SidebarGoal from './SidebarGoal.vue'
import StreakDots from './StreakDots.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前是否停在个人中心（/account）：头像卡、图标、数据卡的显示开关都靠它
const isAccount = computed(() => route.path.startsWith('/account'))

/**
 * 导航项跟随当前区刷新。
 *
 * 学习中心（/personal）和个人中心（/account）共用这一个壳组件实例 ——
 * 跨区切换时 vue-router 复用组件、不重新挂载，只在 onMounted 里读一次
 * matched[1].children 的话，从个人中心切回学习中心时侧栏还挂着上一区的页面清单。
 * 监听 matched[1] 变化重取：同区切子页时引用不变、不重跑，跨区才会刷新。
 */
const syncNav = () => {
  const shell = route.matched[1]
  personalRoute.value = shell ? shell.children.filter(n => n.meta && !n.meta.hidden) : []
}
// 使用路由
const personalRoute = ref([])
watch(() => route.matched[1], syncNav, { immediate: true })

/**
 * 当前高亮项取路由上的 meta.active，而不是「路径最后一段」。
 *
 * 「全部课程」的路径是 /personal/main/myClass/all，最后一段是 all，按路径反推高亮会丢；
 * meta.active 是路由自己声明的归属，支持任意层级。
 */
const activeKey = computed(() => route.meta.active || route.path.split('/').at(-1))
const activeClass = computed(() => item => item.meta.active === activeKey.value)

// 概览数据补齐：所有页面统一兜底（课程页不再自己写概览数据，例外判断已删）。
// 跨区切换 / 跨页切换都要补 —— 同一天 ensureOverview 直接 return，零请求。
onMounted(() => {
  if (!isAccount.value) {
    ensureOverview()
  }
})
watch(() => route.fullPath, () => {
  if (!isAccount.value) {
    ensureOverview()
  }
})

/**
 * 导航目标一律按 name 解析（绝对定位），不要用 item.path。
 *
 * item 是路由记录，path 是**相对路径**（'myExam'，不是 '/personal/main/myExam'）。
 * vue-router 解析相对路径时会以「当前路由的父级」为基准拼接：
 *   停在 /personal/main/myExam      → 'myExam' 拼成 /personal/main/myExam      ✅
 *   停在 /personal/main/myClass/all → 'myExam' 拼成 /personal/main/myClass/myExam ❌
 * 后者没有对应路由，会落进 router/index.js 的 `/:w+` 兜底被静默重定向到 /result/404。
 */
const toOf = item => (item.name ? { name: item.name } : item.path)

/** 导航图标（仅 /account 使用） **/
const ICONS = {
  myOrder: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9.5 8.5h5M9.5 12.5h5"/>',
  myCoupon: '<path d="M3 9.2V7.2A1.2 1.2 0 0 1 4.2 6h15.6A1.2 1.2 0 0 1 21 7.2v2a2.4 2.4 0 0 0 0 5.6v2a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 16.8v-2a2.4 2.4 0 0 0 0-5.6z"/><path d="M14.5 6.4v11.2" stroke-dasharray="2.4 2.4"/>',
  myIntegral: '<path d="M12 3.6l2.6 5.5 6 .9-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 10l6-.9z"/>',
  mySet: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9"/>',
}
const iconOf = name => ICONS[name] || '<circle cx="12" cy="12" r="7.5"/>'

/** 用户区（/account） **/
const userInfo = computed(() => userStore.getUserInfo || {})
const userName = computed(() => userInfo.value.name || '未登录')
// 头像加载失败要退回文字头像，否则会留一个空白圆圈
const iconBroken = ref(false)
const userIcon = computed(() => (iconBroken.value ? '' : userInfo.value.icon || ''))
const initial = computed(() => (userName.value || '?').slice(0, 1))

// 周数（「学习中心 / 第 N 周」）。isoWeek 插件已在 utils/date 里注册
const weekNo = dayjs().isoWeek()

// 退出登录已移至「个人设置」页，此处不再保留入口
</script>
<style lang="scss" scoped>
.LeftNav{
  width: 248px;
  flex: none;
  // 滚动容器是右侧内容区（.personalMain），整页本身不滚，
  // 所以这里不需要 sticky —— 侧栏天然固定不动。
  // align-self 必须留着：父级 align-items:stretch 会把侧栏拉成和内容区等高
  align-self: flex-start;
  // 用户卡 + 导航 + 数据卡加起来可能超过一屏，窗口矮的时候让它自己内部滚
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* ① 用户卡（/account） */
.meCard{
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-main) 0%, var(--color-hover) 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(27, 75, 107, .20);
  &::after{
    content: "";
    position: absolute;
    right: -30px;
    top: -40px;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .07);
  }
}
.meAvatar{
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, .35);
}
.meAvatarTxt{
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-main);
}
.meInfo{
  min-width: 0;
}
.meName{
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ① 顶部标识（学习中心） */
.brandCard{
  padding: 14px 4px 2px;
  .brandTitle{
    font-size: 17px;
    font-weight: 600;
    color: var(--color-font1);
  }
  .brandWeek{
    margin-top: 3px;
    font-size: 11px;
    color: var(--color-font3);
  }
}

/* ② 主导航 */
.nav{
  margin-top: 12px;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--color-background2);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(26, 29, 33, .04);
}
/* 左侧竖条高亮：两个区同一套语言，选中的是「这一项」，不是「这块底色」 */
.navItem{
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 12px;
  border-left: 2px solid transparent;
  border-radius: 0 8px 8px 0;
  font-size: 15px;
  color: var(--color-font2);
  transition: background-color .2s, color .2s;
  // 全局 a{color:var(--color-main)} 会把未选中项也染成主色，这里要显式压掉
  &:hover{
    background: var(--color-background5);
    color: var(--color-font1);
  }
  &.on{
    background: var(--color-main-light);
    color: var(--color-main);
    font-weight: 600;
    border-left-color: var(--color-main);
    .i{
      stroke: var(--color-main);
    }
  }
}
.i{
  width: 19px;
  height: 19px;
  flex: none;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ③ 数据卡（/personal）：与 .nav 同一套卡片语言 */
.sidebarGoal,
.streakDots{
  margin-top: 14px;
}
</style>
