<!-- 个人中心 - 左侧导航  -->
<template>
  <div class="LeftNav">
    <!-- 用户区：头像 + 昵称 + 在学门数，替代原来「纯链接列表」的空白头部 -->
    <div class="meCard">
      <img v-if="userIcon" class="meAvatar" :src="userIcon" alt="" @error="iconBroken = true">
      <div v-else class="meAvatar meAvatarTxt">{{ initial }}</div>
      <div class="meInfo">
        <div class="meName">{{ userName }}</div>
        <!-- 没取到就显示「—」，不要拿默认值 0 冒充「你没有课」 -->
        <div class="meSub">在学 {{ overview.courseReady ? overview.courseCount + ' 门' : '—' }}</div>
      </div>
    </div>

    <!-- 主导航：图标在左、文字在中，选中态用浅主色底，不再用 border-bottom 分隔 -->
    <nav class="nav">
      <router-link class="navItem" :class="{'on': activeClass(item)}" v-for="item in personalRoute"
                   :key="item.path" :to="item.path">
        <svg class="i" viewBox="0 0 24 24" v-html="iconOf(item.name)"></svg>
        <span>{{item.meta.title}}</span>
      </router-link>
    </nav>

    <!-- 学习概览：原来占着内容区顶部一整行的三块统计，挪到这里填掉侧边栏下半截空白。
         这些数字是账号级的（跟当前停在哪个子页无关），所以所有个人中心页都常驻显示；
         数据没回来之前显示「-」，不先摆一个 0 上去假装是真实值 -->
    <div class="ovCard">
      <div class="ovHead">学习概览</div>
      <div class="ovRow">
        <span class="ovLabel">在学课程</span>
        <span class="ovVal hl">
          <template v-if="overview.courseReady">{{ overview.courseCount }}<em>门</em></template>
          <template v-else>-</template>
        </span>
      </div>
      <div class="ovRow">
        <!-- 分子是「本周实际完成的小节数」（跨所有课），分母是「每周目标节数之和」。
             原来 label 写「本周计划」+ 值「4 / 1」，读起来像「计划 1 个却完成 4 个」的矛盾；
             改成「已学 + 目标」两个词各就各位（和我的课程页头保持同一口径） -->
        <span class="ovLabel">本周已学</span>
        <span class="ovVal">
          <template v-if="overview.weekReady">{{ overview.weekFinished }}<em>/ 目标 {{ overview.weekPlan }}</em></template>
          <template v-else>-</template>
        </span>
      </div>
      <div class="ovRow">
        <span class="ovLabel">本周积分</span>
        <span class="ovVal">{{ overview.weekReady ? overview.weekPoints : '-' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { ensureOverview, useClassOverview } from '../useClassOverview'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const overview = useClassOverview()
// 使用路由
const personalRoute = ref([])

/**
 * 当前高亮项取路由上的 meta.active，而不是「路径最后一段」。
 *
 * 原来的写法是 route.path.split('/').at(-1)，再拿它去和每个导航项的 meta.active 做前缀匹配。
 * 对 /personal/main/myClass 这种一级子页面刚好等价，但「全部课程」的路径是
 * /personal/main/myClass/all，最后一段是 all，高亮会直接丢掉。
 * meta.active 是路由自己声明的归属，比从路径反推更准，也支持任意层级。
 */
const activeKey = computed(() => route.meta.active || route.path.split('/').at(-1))
const activeClass = computed(() => item => item.meta.active === activeKey.value)

// 概览卡：常驻，不再限定页面 —— 见 useClassOverview.ensureOverview 的说明

/** 导航图标 **/
// 路由 meta.icon 存的是 iconfont 码位，这里换成线性 SVG：30px 的图标字重和 15px 文字不匹配，
// 而且 iconfont 里没有「课程/订单」这类语义准确的图形。按路由名映射，缺的走默认圆点。
const ICONS = {
  myClass: '<path d="M4 5.6A1.6 1.6 0 0 1 5.6 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.6A1.6 1.6 0 0 1 4 15.4z"/><path d="M20 5.6A1.6 1.6 0 0 0 18.4 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.4a1.6 1.6 0 0 0 1.6-1.6z"/>',
  myExam: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M9 13l2 2 4-4.5"/>',
  myOrder: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9.5 8.5h5M9.5 12.5h5"/>',
  myCoupon: '<path d="M3 9.2V7.2A1.2 1.2 0 0 1 4.2 6h15.6A1.2 1.2 0 0 1 21 7.2v2a2.4 2.4 0 0 0 0 5.6v2a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 16.8v-2a2.4 2.4 0 0 0 0-5.6z"/><path d="M14.5 6.4v11.2" stroke-dasharray="2.4 2.4"/>',
  myIntegral: '<path d="M12 3.6l2.6 5.5 6 .9-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 10l6-.9z"/>',
}
const iconOf = name => ICONS[name] || '<circle cx="12" cy="12" r="7.5"/>'

/** 用户区 **/
const userInfo = computed(() => userStore.getUserInfo || {})
const userName = computed(() => userInfo.value.name || '未登录')
// 头像加载失败要退回文字头像，否则会留一个空白圆圈
const iconBroken = ref(false)
const userIcon = computed(() => (iconBroken.value ? '' : userInfo.value.icon || ''))
const initial = computed(() => (userName.value || '?').slice(0, 1))

onMounted(() => {
  const currentRoute = router.currentRoute.value
  // 获取个人中心的子路由作为导航
  personalRoute.value = currentRoute.matched[1].children.filter(n => n.meta && !n.meta.hidden)
  // 停在「我的课程」时不用补 —— 那个页面本来就会拉全量数据写进概览，再补一次就是重复请求。
  // 其他页面（我的考试/订单/优惠券/积分）侧边栏要自己把概览和最近学习补齐，否则下半截全空。
  // ⚠️ 这里判的是路由 name，不是 activeKey：「全部课程」(`myClass/all`) 的 meta.active 也是 myClass，
  // 用 activeKey 判会把它误当成「我的课程」跳过，而它并不写概览 → 直接进/刷新该页时侧栏全是「-」。
  if (route.name !== 'myClass') {
    ensureOverview()
  }
})

// 个人中心内部切页不会重新挂载 LeftNav，onMounted 只跑一次。
// 这里补一个路由监听：跨天之后再切页会把概览重拉一遍（同一天 ensureOverview 直接 return，零请求）。
watch(() => route.fullPath, () => {
  if (route.name !== 'myClass') {
    ensureOverview()
  }
})

// 退出登录已移至顶部头像下拉菜单（components/Header.vue），此处不再保留入口
</script>
<style lang="scss" scoped>
.LeftNav{
  width: 248px;
  flex: none;
  // 滚动容器是右侧内容区（.personalMain），整页本身不滚，
  // 所以这里不需要 sticky —— 侧栏天然固定不动。
  // align-self 必须留着：父级 align-items:stretch 会把侧栏拉成和内容区等高
  align-self: flex-start;
  // 用户卡 + 导航 + 概览 + 最近学习加起来接近一屏（1440×900 实测 776px / 内容区 778px），
  // 窗口再矮就会被裁掉底部（「继续学习」按钮看不见）。给个上限让它自己内部滚。
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* ① 用户区 */
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
.meSub{
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
  color: rgba(255, 255, 255, .72);
}

/* ② 主导航 */
.nav{
  margin-top: 16px;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--color-background2);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(26, 29, 33, .04);
}
.navItem{
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  border-radius: 8px;
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

/* ③ 学习概览 */
.ovCard{
  margin-top: 16px;
  padding: 4px 18px;
  background: #fff;
  border: 1px solid var(--color-background2);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(26, 29, 33, .04);
}
.ovHead{
  padding: 14px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-font2);
}
.ovRow{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px dashed var(--color-background2);
  &:first-of-type{
    border-top: none;
  }
}
.ovLabel{
  font-size: 13px;
  color: var(--color-font2);
}
.ovVal{
  font-size: 20px;
  font-weight: 600;
  color: var(--color-font1);
  em{
    margin-left: 3px;
    font-style: normal;
    font-size: 12px;
    font-weight: 400;
    color: var(--color-font2);
  }
  &.hl{
    color: var(--color-main);
  }
}
</style>
