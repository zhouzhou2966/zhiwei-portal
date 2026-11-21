<!-- 页面头部 · v40 壳层
     视觉对照 prototype/redesign.html 的 header：白底毛玻璃 + 下划线导航 + 胶囊搜索。
     业务逻辑全部保留：登录态探测、搜索直达 /search、购物车登录校验、
     消息入口、头像下拉（个人设置 / 退出登录）。 -->
<template>
  <header class="zwHeader">
    <div class="wrap hd">
      <router-link to="/" class="logo">知微<em>ZHIWEI</em></router-link>

      <nav>
        <span
          v-for="item in navItems"
          :key="item.key"
          :class="{ on: item.active }"
          @click="goNav(item)"
        >{{ item.label }}</span>
      </nav>

      <div class="search">
        <input
          v-model="input"
          type="text"
          placeholder="搜索课程、知识卡、话题"
          @keyup.enter="SearchHandle"
        />
        <i class="sIcon" @click="SearchHandle"></i>
      </div>

      <div class="acts">
        <span class="actLink" @click="goChat">消息</span>
        <span class="actLink" @click="goCart">购物车</span>

        <!-- 头像 = 个人中心入口：点击直达，不再弹下拉菜单。
             订单 / 券 / 积分 / 设置都在个人中心左导航里，弹一层菜单等于重复列一遍目录；
             退出登录挪进了「个人设置」的账号安全页 -->
        <div
          v-if="userInfo && userInfo.name"
          class="userTrigger"
          title="进入个人中心"
          @click="goAccount"
        >
          <img class="avatar" :src="headerIcon" @error="onerrorImg" alt="" />
        </div>
        <div class="auth" v-else>
          <span @click="() => $router.push({ path: '/login', query: { md: 'register' } })">注册</span>
          <i>/</i>
          <span @click="() => $router.push('/login')">登录</span>
        </div>
      </div>
    </div>
  </header>
</template>
<script setup>
import { computed, onBeforeMount, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore, isLogin, getToken, dataCacheStore } from '@/store'
import { getUserInfo } from '@/api/user'
import router from '../router'

// 默认头像（用户无头像或图片加载失败时使用）
const defaultImage = '/avatar-default.svg'

const store = useUserStore()
// 用户信息必须用 computed 直接绑 store（存快照会导致头像上传后不刷新，见旧版注释）
const userInfo = computed(() => store.getUserInfo)

const brokenIcon = ref('')
const headerIcon = computed(() => brokenIcon.value || userInfo.value.icon || defaultImage)
watch(() => userInfo.value.icon, () => { brokenIcon.value = '' })
const onerrorImg = () => { brokenIcon.value = defaultImage }

const input = ref('')
const route = useRoute()
const userStore = getToken()
const dataCache = dataCacheStore()

// 导航：学习 = 学习中心「我的课程」（游客点学习先去登录，与旧版学习中心入口行为一致）。
// 订单 / 优惠券 / 积分 / 设置在「个人中心」（/account），入口是头像点击直达，不占顶栏位
const navItems = computed(() => [
  { key: 'home', label: '发现', path: '/main/index', active: route.path === '/main/index' },
  { key: 'explore', label: '探索', path: '/search/index', active: route.path.startsWith('/search') },
  {
    key: 'learn',
    label: '学习',
    path: '/personal/main/overview',
    // 个人中心（/account）不算「在学习」，顶栏学习不再高亮
    active: route.path.startsWith('/personal') || route.path.startsWith('/learning'),
    needLogin: true
  },
  { key: 'chat', label: '交流', path: '/main/chat', active: route.path.startsWith('/main/chat') }
])

const goNav = (item) => {
  if (item.needLogin && !(userInfo.value && userInfo.value.id)) {
    ElMessage({ message: '请先登录哦', type: 'warning' })
    router.push({ path: '/login', query: { redirect: item.path } })
    return
  }
  router.push(item.path)
}

const goChat = () => {
  if (!(userInfo.value && userInfo.value.id)) {
    ElMessage({ message: '请先登录哦', type: 'warning' })
    router.push({ path: '/login', query: { redirect: '/main/chat' } })
    return
  }
  router.push('/main/chat')
}

onBeforeMount(async () => {
  // store 未登录时是 {}（truthy），判断有没有 id
  if (!userInfo.value.id) {
    if (await isLogin()) {
      const res = await getUserInfo()
      if (res.code === 200 && !!res.data) {
        store.setUserInfo(res.data)
      }
    } else {
      userStore.logout()
    }
  }
  if (Object.keys(route.query).length > 0) {
    input.value = route.query.key
  }
})

// 离开搜索页清空输入框；回到搜索页回填关键词
watchEffect(() => {
  if (route.path !== '/search/index') {
    input.value = ''
  } else {
    input.value = dataCache.getSearchKey
  }
})

// 头像点击直达个人中心（默认落「个人设置」）。
// 原来的下拉菜单砍掉的原因：菜单里每一项在个人中心左导航里都有，
// 弹一层等于把那份目录再抄一遍；退出登录挪到了「个人设置」的账号安全页
const goAccount = () => router.push('/account/main/mySet')

/**
 * 购物车入口：未登录直接去登录页。
 * /ts/carts 需要鉴权，放游客进去只会 401 循环弹窗（旧版踩过，见旧版注释）。
 */
const goCart = () => {
  const path = '/pay/carts'
  if (userInfo.value && userInfo.value.id) {
    router.push(path)
  } else {
    ElMessage({ message: '请先登录哦', type: 'warning' })
    router.push({ path: '/login', query: { redirect: path } })
  }
}

// 搜索事件：写入缓存关键词并跳 /search（探索页的搜索态由 query.key 触发）
const SearchHandle = () => {
  if (input.value == '') {
    ElMessage({ type: 'error', message: '请输入搜索关键词！' })
    return false
  }
  dataCache.setSearchKey(input.value)
  router.push({ path: '/search', query: { key: input.value } })
}
</script>
<style lang="scss" scoped>
.zwHeader {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(26, 29, 33, 0.03);
}

.wrap {
  width: min(1280px, calc(100% - 80px));
  margin: 0 auto;
}

.hd {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 36px;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 7px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--main);

  em {
    font-family: var(--font-serif);
    font-size: 10.5px;
    font-style: normal;
    letter-spacing: 1.2px;
    color: var(--ink3);
  }
}

nav {
  display: flex;
  gap: 30px;

  span {
    font-size: 15px;
    color: var(--ink2);
    cursor: pointer;
    padding: 6px 0;
    position: relative;

    &:hover {
      color: var(--ink);
    }

    &.on {
      color: var(--ink);
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -2px;
        height: 2px;
        background: var(--main);
        border-radius: 2px;
      }
    }
  }
}

.search {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 280px;
  height: 38px;
  padding: 0 12px 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  transition: border-color 0.18s, background-color 0.18s;

  &:focus-within {
    border-color: var(--main-light2, #c8d8e2);
    background: #fff;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 13px;
    color: var(--ink);

    &::placeholder {
      color: var(--ink3);
    }
  }

  .sIcon {
    flex: none;
    width: 14px;
    height: 14px;
    cursor: pointer;
    border: 1.6px solid var(--ink3);
    border-radius: 50%;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: -5px;
      bottom: -1px;
      width: 7px;
      height: 1.6px;
      background: var(--ink3);
      border-radius: 1px;
      transform: rotate(45deg);
    }
  }
}

.acts {
  display: flex;
  align-items: center;
  gap: 20px;
  color: var(--ink2);
  font-size: 13px;

  .actLink {
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
      color: var(--main);
    }
  }
}

.userTrigger {
  cursor: pointer;
  outline: none;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--line);
  }
}

.auth {
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    cursor: pointer;

    &:hover {
      color: var(--main);
    }
  }

  i {
    color: var(--ink3);
    font-style: normal;
  }
}
</style>
