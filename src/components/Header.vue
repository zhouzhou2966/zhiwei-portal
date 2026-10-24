<!-- 页面头部组件 -->
<template>
  <header class="bg-wt">
    <div class="container fx">
      <div class="logo">
        <router-link to="/"><img src="/logo.svg" alt="知微" /></router-link>
      </div>
      <!-- 头部分类-start -->
      <div v-if="route.path != '/main/index' && route.path != '/login' " class="courseClass font-bt2"
           @mouseover="() => isShow = true" @mouseout="() => isShow = false">
        <i class="iconfont zhy-icon_fenlei_nor"></i> 分类
      </div>
      <div v-if="route.path != '/main/index' && route.path != '/login' " class="courseClassList" v-show="isShow"
           @mouseover="() => isShow = true" @mouseout="() => isShow = false">
        <div class="firstItems">
          <ClassCategory :data="courseClass" type="float"></ClassCategory>
        </div>
      </div>
      <!-- 头部分类-end -->
      <div class="fx-1 fx-ct">
        <el-input
            v-model="input"
            class="headerSearch "
            size="large"
            placeholder="请输入关键字"
            @keyup.enter="SearchHandle"

        >
          <template v-slot:prefix>
            <Search class="search" @click="SearchHandle"/>
          </template>
        </el-input>
      </div>
      <div class="fx-al-ct pt-rt">
        <div class="car fx-al-ct font-bt2" v-if="userInfo" @click="() => $router.push('/pay/carts')">
          <i class="iconfont">&#xe6f3;</i> 购物车
        </div>
        <!-- 学习中心 - start -->
        <div v-if="userInfo  && userInfo.name">
          <span class="marg-lr-40 font-bt2" style="padding:27px 0"
                @click="() => $router.push('/main/chat')">消息</span>
          <span class="marg-lr-40 font-bt2" style="padding:27px 0"
                @click="() => {$router.push('/personal/main/myClass')}" @mouseover="()=> learningShow = true"
                @mouseout="() => learningShow = false">学习中心</span>
          <div  class="learningCont" v-show="learningShow && learnClassInfo && learnClassInfo.courseAmount"
               @mouseover="()=> learningShow = true" @mouseout="() => learningShow = false">
            <div class="count"><em>{{ learnClassInfo && learnClassInfo.courseAmount }}</em> 门课程</div>
            <div class="info" v-if="learnClassInfo &&learnClassInfo.courseId">
              <div class="fx-sb">
                <span>{{ learnLabel }}：</span>
                <div class="fx">
                  <span class="bt"
                        @click="() => $router.push({path: '/learning/index', query: {id: learnClassInfo.courseId}})">继续学习</span>
                  <span class="bt bt-grey1" @click="() => $router.push('/personal/main/myClass')">全部课程</span>
                </div>
              </div>
              <div class="tit">{{ learnClassInfo && learnClassInfo.courseName }}</div>
              <!-- 后端 latestSectionName 为空（从没学过 / 大纲把那一节删了）时给个占位，
                   否则这里只剩一个「%」，看着像渲染坏了 -->
              <div class="perc fx-sb"> {{ learnClassInfo && (learnClassInfo.latestSectionName || '—') }}
                <i>{{ learnPercent }}%</i>
              </div>
            </div>
          </div>
        </div>
        <!-- 登录注册 - start -->
        <el-dropdown v-if="userInfo && userInfo.name" trigger="click" placement="bottom-end"
                     popper-class="header-user-dropdown" @command="handleUserCommand">
          <div class="fx-al-ct userTrigger">
            <img class="headIcon" :src="headerIcon" @error="onerrorImg" alt="">
            <div class="userName">{{ userInfo.name }}</div>
            <el-icon class="userArrow"><ArrowDown/></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="mySet">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div class="cur-pt" v-else>
          <span class="font-bt2" @click="() => $router.push({path: '/login', query: {md: 'register'}})">注册 </span><span>/</span>
          <span class="font-bt2" @click="() => $router.push('/login')"> 登录</span>
        </div>

      </div>
    </div>
  </header>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
import {computed, onBeforeMount, onMounted, ref, watch, watchEffect} from "vue";
import {Search, ArrowDown} from "@element-plus/icons-vue";
import {useUserStore, isLogin, getToken, dataCacheStore} from '@/store'
import {getUserInfo, userLogout} from "@/api/user"
import router from "../router";
import {useRoute} from "vue-router";
import {ElMessage} from "element-plus";
import ClassCategory from "./ClassCategory.vue";
import {getClassCategorys} from '@/api/class.js'
// 「最近学习课程」走模块级共享状态：Header 和「我的课程」页原来各发一次同一个请求
import {loadNowLesson, useNowLesson} from '@/utils/nowLesson'
import {tryRefreshToken} from '../utils/refreshToken'
import {hasToken} from '../utils/authToken'

// 默认头像（用户无头像或图片加载失败时使用）
const defaultImage = '/avatar-default.svg'

const store = useUserStore();
/**
 * 用户信息必须用 computed 直接绑 store，不能用 `ref()` 存快照。
 * 原来的写法是 `const userInfo = ref()`，在 onBeforeMount 里 `userInfo.value = store.getUserInfo`
 * —— 存的是那一刻的「对象引用」。别处调用 store.setUserInfo(新对象) 之后（例如
 * mySet 上传头像后自动落库），这里的 ref 仍然指向旧对象，表现就是「顶部头像要刷新页面才变」。
 * 用 computed 之后，store 里换对象/改字段都会自动反映到模板。
 */
const userInfo = computed(() => store.getUserInfo)
/**
 * 头像加载失败时的兜底图。
 * ⚠️ 不能像原来那样写 `userInfo.value.icon = defaultImage`：userInfo 是 computed，
 * 读出来的是 store 里那个对象，这么写等于**直接改 store 的 userInfo** ——
 * 头像地址一旦 404，整个会话里 store 的头像就被永久换成默认图（个人设置页也会跟着显示默认图），
 * 而且这是「渲染副作用」，排查时非常隐蔽。
 * 正确做法：只在 Header 内部记一个覆盖值，store 保持干净。
 */
const brokenIcon = ref('')
const headerIcon = computed(() => brokenIcon.value || userInfo.value.icon || defaultImage)
// 用户换头像（store 里的 icon 变了）后要清掉覆盖值，否则新头像会被默认图一直挡住
watch(() => userInfo.value.icon, () => { brokenIcon.value = '' })
const onerrorImg = () => { brokenIcon.value = defaultImage }
const isToken = hasToken()
const input = ref('');
const route = useRoute()
const userStore = getToken();
const dataCache = dataCacheStore();
const courseClass = ref([]) // 分类数据
const isShow = ref(false)  // 分类展示
/**
 * 我真正学习的课程信息 - 学习中心展示。
 * 直接用 nowLesson 模块的共享 ref：Header 和「我的课程」页读的是同一份数据，
 * 页面刷新后 Header 不必再单独请求一次。
 */
const {nowLesson: learnClassInfo} = useNowLesson()
const learningShow = ref(false) // 学习中心hover模块展示

/**
 * 「学习中心」下拉里这一行的前缀。原来写死「正在学习」，两种情况都不对：
 *   · 课程学完了（status=2），标签已经是「已学完」，还说「正在学习」自相矛盾；
 *   · 课程还没开始（status=0），压根没在学。
 * status: 0-未学习 1-学习中 2-已学完 3-已失效
 */
const learnLabel = computed(() => {
  const s = Number(learnClassInfo.value && learnClassInfo.value.status)
  if (s === 2) return '最后学习'
  if (s === 0) return '还未学习'
  if (s === 3) return '已失效'
  return '正在学习'
})
/**
 * 进度百分比必须封顶 100：learnedSections 是学习记录条数，课程改过大纲之后会出现
 * 23 / 12 这种自相矛盾的组合（学习记录不随大纲删除而回滚），
 * 不封顶这里会显示 192%。
 */
const learnPercent = computed(() => {
  const total = Number(learnClassInfo.value && learnClassInfo.value.sections) || 0
  const learned = Number(learnClassInfo.value && learnClassInfo.value.learnedSections) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round(learned * 100 / total))
})

onBeforeMount(async () => {
  // 用户信息已经由上面的 computed 直接绑到 store 上，这里只负责「store 里没有真实用户信息时补一次请求」。
  // 注意：store 未登录时是 {}（truthy），所以不能用 `!userInfo.value` 判断，要看有没有 id。
  if (!userInfo.value.id) {
    if (await isLogin()) {
      let res = await getUserInfo();
      if (res.code === 200 && !!res.data) {
        // 只写 store 即可，computed 会自己反映，不需要再给 userInfo 赋值
        store.setUserInfo(res.data);
      }
    } else {
      userStore.logout();
    }
  }

  courseClass.value = dataCache.getCourseClassDataes
  // 先从store里拿如何没有就请求分类信息获取
  if (courseClass.value.length === 0) {
    getCourseClassHandle()
  }
  if (Object.keys(route.query).length > 0) {
    input.value = route.query.key
  }
  if (await isLogin()) {
    // 查询我正在学习的课程
    getLearnClassInfoHandle()
  }
})
// 监听路由 清空搜索框的值
watchEffect(() => {
  if (route.path !== '/search/index') {
    input.value = ''
  } else {
    input.value = dataCache.getSearchKey
  }
})
// 学习中心的信息

// 查询我正在学习的课程
/**
 * ⚠️ 失败一律静默降级，不弹 toast。
 * Header 是全局组件 —— 这里一弹，learning 服务挂掉时用户每切一个页面就弹一条
 * 「学习状态查询出错！」，全站刷屏（和支付页那个 5 秒一条是同一类问题）。
 * 学习中心少一块内容不影响任何操作，把 learnClassInfo 置空让下拉收起来就够了。
 * 401 由 request.js 的拦截器统一处理，这里不用管。
 *
 * 请求本身交给 nowLesson 模块去合并：这里不传 force，5 秒内复用「我的课程」页
 * 刚拉到的数据；页面刷新时由谁先挂载谁发起，另一个直接复用 inFlight。
 */
const getLearnClassInfoHandle = async () => {
  await loadNowLesson()
}


// 获取课程分类
const getCourseClassHandle = async () => {
  await getClassCategorys()
      .then((res) => {
        if (res.code == 200) {
          courseClass.value = res.data;
          dataCache.setCourseClassDataes(res.data)
        } else {
          ElMessage({
            message: errMsg(res),
            type: "error",
          });
        }
      })
      .catch(() => {
        ElMessage({
          message: "分类请求出错！",
          type: "error",
        });
      });
}
// 默认头像（onerrorImg / headerIcon 已在文件顶部定义，见「头像加载失败的兜底」注释）

// 头像下拉菜单：分发「个人设置 / 退出登录」
const handleUserCommand = (command) => {
  if (command === 'mySet') {
    router.push('/personal/main/mySet')
    return
  }
  if (command === 'logout') {
    logoutHandle()
  }
}

// 退出登录：先通知后端注销，再清本地凭据并回首页（原 LeftNav 的退出逻辑迁到此处）
const logoutHandle = () => {
  userLogout().then(res => {
    if (res.code === 200) {
      store.logout()
      location.href = '/'
    }
  }).catch(() => {})
}
// 搜索事件
const SearchHandle = () => {
  if (input.value == '') {
    ElMessage({
      type: 'error',
      message: '请输入搜索关键词！'
    })
    return false
  }
  dataCache.setSearchKey(input.value)
  router.push({path: '/search', query: {"key": input.value}})
}

</script>
<style lang="scss" scoped>
header {
  width: 100%;
  background-color: var(--color-white);
  text-align: left;
  padding: 11px 0;
  font-size: 14px;

  .courseClass {
    position: relative;
    line-height: 48px;
    margin-left: 26px;
    display: flex;
    font-size: 14px;

    .iconfont {
      font-size: 24px;
      margin-right: 5px;
    }
  }

  .courseClassList {
    position: absolute;
    z-index: 999;
    top: 50px;
    left: 102px;

    .firstItems {
      background-color: #fff;
    }
  }

  .headerSearch {
    width: 427px;
    height: 40px;
    background: var(--color-background2);
    border-radius: 8px;

    :deep(.el-input__wrapper) {
      background-color: transparent;
    }

    .search {
      position: absolute;
      cursor: pointer;
      right: 0;
      width: 15px;
      height: 15px;

    }
  }

  .car {
    img {
      width: 24px;
      height: 25px;

    }

    .iconfont {
      font-size: 24px;
      margin-right: 6px;
    }
  }

  .learningCont {
    position: absolute;
    z-index: 999;
    width: 330px;
    height: 200px;
    border-radius: 8px;
    left: -40px;
    top: 45px;
    background-color: #fff;
    box-shadow: 0 4px 6px 2px rgba(108, 112, 118, 0.17);

    &::before {
      position: absolute;
      z-index: -1;
      content: '';
      top: -5px;
      left: 43%;
      display: inline-block;
      width: 15px;
      height: 15px;
      background-color: #fff;
      transform: rotate(45deg);
      box-shadow: 0 4px 6px 2px rgba(108, 112, 118, 0.17);
    }

    .count {
      background-color: #fff;
      padding: 20px 20px 20px 20px;
      line-height: 40px;
      border-bottom: 1px solid #EEEEEE;
      display: flex;

      em {
        color: var(--color-main);
        font-family: PingFangSC-S0pxibold;
        font-weight: 600;
        font-size: 28px;
        margin-right: 4px;
        font-style: normal;
      }
    }

    .info {
      padding: 13px 20px 20px 20px;
      line-height: 28px;
      color: #80878C;

      .bt {
        line-height: 28px;
        height: 28px;
        font-size: 12px;
        padding: 0 10px;
        margin-left: 10px;
      }

      .tit {
        font-weight: 600;
        font-size: 14px;
        line-height: 28px;
        color: #19232B;
      }

      .perc {
        i {
          font-style: normal;
          color: #80878C;
        }
      }
    }
  }

  .userTrigger {
    cursor: pointer;
    padding: 4px 0;
    outline: none;

    .userName {
      max-width: 96px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .userArrow {
      font-size: 12px;
      margin-left: 4px;
      color: #80878C;
    }
  }

  .headIcon {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    margin-right: 10px;
  }
}
</style>
