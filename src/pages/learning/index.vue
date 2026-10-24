<!-- 课程学习 -->
<template>
  <div class="classLearning">
    <div class="videoCont">
      <div class="head fx-sb">
        <div class="fx cur-pt" @click="goBack">
          <img src="@/assets/icon_back.png" alt="">
          <div>返回 <span class="line">|</span> {{ currentPlayData.sectionName }}</div>
        </div>
      </div>
      <div class="videoCont">
        <div class="video" v-show="pageType == 1 && !loadFailed && !playFailed && !expired">
          <video id="videoRef" ref="videoRef"></video>
          <!-- 自动播放被浏览器策略拦下（连静音重试都失败）时的兜底。
               给一个明确的「点击播放」，比静默失败好 —— 否则用户只看到一块黑屏，不知道要点一下 -->
          <div class="clickPlay" v-if="autoplayBlocked" @click="playByUserGesture">
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
              <path d="M8 5l11 7-11 7z" fill="#fff"/>
            </svg>
            <span>点击播放</span>
          </div>
        </div>
        <!-- 课程信息没拿到时给个明确的占位 + 重试入口，而不是留一片白屏。
             具体原因写进面板，不再额外弹 toast —— 面板常驻，弹窗会重复播报同一件事 -->
        <div class="loadFailed" v-if="loadFailed">
          <p class="tit">课程信息加载失败</p>
          <p class="sub">{{ loadFailedMsg }}</p>
          <el-button type="primary" @click="reload">重新加载</el-button>
        </div>
        <!-- 课程已过期：不再给播放器，也不再取签名。
             原来过期课程照样能播完 —— 收藏了链接或者从历史记录点进来就行 -->
        <div class="loadFailed" v-else-if="expired">
          <p class="tit">课程已过期</p>
          <p class="sub">{{ expiredMsg }}</p>
          <el-button type="primary"
                     @click="$router.push({path: '/details/index', query: {id: detailsId}})">查看课程详情</el-button>
        </div>
        <!-- 播放签名没拿到时同理：原来只有一条 toast，视频区是一片纯黑，看着像卡死 -->
        <div class="loadFailed" v-else-if="playFailed && pageType == 1">
          <p class="tit">视频加载失败</p>
          <p class="sub">{{ playFailedMsg }}</p>
          <el-button type="primary" @click="retryPlay">重新加载</el-button>
        </div>
        <Practise v-if="pageType == 2" @playHadle="playHadle" :examInfo="examInfo"
                  :key="currentPlayData.sectionId"></Practise>
      </div>
    </div>
    <!-- 右侧目录、问答、笔记 - start -->
    <div class="learn" :class="{close: isClose}">
      <div class="closeRt cur-pt" :class="{close: isClose}" @click="close"><i class="iconfont zhy-a-shouqi2x"></i></div>
      <div class="teachInfo fx">
        <img @click="() => $router.push({path:'/details/index', query:{id: learningClassDetails.id}})"
          :src="learningClassDetails && learningClassDetails.coverUrl" alt="">
        <div class="">
          <div class="tit">{{learningClassDetails && learningClassDetails.name}}</div>
          <div class="teacher ft-14"> 讲师 : {{learningClassDetails && learningClassDetails.teacherName}}</div>
        </div>
      </div>
      <div class="cont">
        <div class="pd-lr-10">
          <TableSwitchBar :data="tableBar" @changeTable="changeTable"></TableSwitchBar>
        </div>
        <!-- 目录 -->
        <div class="catalogue" v-show="actId == 1" v-infinite-scroll="load" style="overflow: auto">
          <Catalogue :data="chapters" :playId="playId"
                     :finished="finished" :finishedSections="finishedSectionIds"
                     @playHadle="playHadle" @openCatalogue="openCatalogue"></Catalogue>
        </div>
        <!-- 问答 -->
        <div class="question" v-if="actId == 2" v-infinite-scroll="load" style="overflow: auto">
          <Question></Question>
        </div>
        <!-- 笔记 -->
        <div class="note" v-if="actId == 3" v-infinite-scroll="load" style="overflow: auto">
          <Note :currentTime="currentPlayTime"></Note>
        </div>
      </div>
    </div>
    <!-- 右侧弹出问答、笔记 - start -->
    <div class="askAndNote" :class="{close: !isClose}" @click="open">
      <div class="fx-cl-ct">
        <img src="../../assets/btn-wd.png" alt="">
        <p>问答</p>
      </div>
      <div class="fx-cl-ct">
        <img src="../../assets/btn-bj.png" alt="">
        <p>笔记</p>
      </div>
    </div>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
/** 数据导入 **/
import { onMounted, ref, onUnmounted, provide, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getMediasSignature, addPlayLog, getLearningClassDetails, getFinishedSections, getCourseLearning } from "@/api/class.js";
import { useRoute } from "vue-router";
import { dataCacheStore } from "@/store"
import { invalidateNowLesson } from "@/utils/nowLesson"
// 组件导入
import TableSwitchBar from "./components/TableSwitchBar.vue";
import Catalogue from "./components/Catalogue.vue";
import Question from "./components/Question.vue";
import Practise from "./components/Practise.vue";
import Note from "./components/Note.vue";
import icon from '@/assets/icon_good.png'

import router from "../../router";
import {reactive} from "@vue/reactivity";
import { PLAYER_APP_ID } from "@/config/player";
import proxy from "@/config/proxy";
import { getToken } from "@/utils/authToken";

// 接口域名。页面卸载时的补发走原生 fetch（见 flushPlayLog），拿不到 axios 的 baseURL，这里自己拼
const API_HOST = (proxy[import.meta.env.MODE || 'development'] || proxy.development).host

const route = useRoute()
const store = dataCacheStore()

// 主展示区域 1 为视频 2 为练习 3 考试
const pageType = ref(1)
// 结果 - 详情Id
const detailsId = ref({})
// 课程信息及讲师信息
const tableBar = [{id: 1, name: '目录'}, {id: 2, name: '问答'}, {id: 3, name: '笔记'}]
// 课程目录
const classListData = ref([])

const videoRef = ref(null)

/** 方法定义 **/
/*
* 本节有三种模式播放  
* 一、免费课程 - 先点击点击到学习计划然后进入这里学习
* 二、购买的课程 - 购买成功自动加入学习计划到这里学习
* 三、试听 - 无需加入学习计划直接学习
* 先加载当前课程信息
* 然后获取学习计划信息
* 通过课程计划自动调整到对应的小节 - 通过小节Id 获取视频签名（用于视频播放）
* 点击小节 - 通过小节Id 获取视频签名（用于视频播放）
*
*/

// 默认播放小节
const playId = ref('')
// 是否播完
const finished = ref(false);
// 记录播放相关参数
const fileId = ref('')
const signature = ref('')
let timer = -1;
let playing = false;
// 是否正在「点目录切换小节」的换源过程中。
// loadVideoByID 是异步的，换源期间旧视频还会再发几次 timeupdate，
// 那些回调带的是「上一节」的播放位置，会把 currentPlayData.moment 覆盖成上一节的时间，
// 紧接着的播放记录上报就会把「上一节的进度」写到「这一节」头上。
let switchingSection = false;
// 换源序号：每点一次小节自增。seek 回调只有序号仍是最新的那次才生效，
// 否则连点两个小节时，前一次的兜底定时器会把后一次的视频 seek 到上一节的位置。
let switchSeq = 0;
// 播放器里「当前真正加载着」的小节id。
// ⚠️ 不能用 currentPlayData.sectionId 代替：点目录的瞬间它就被改成新小节了，
// 但视频还停在上一节，这中间的空档上报会把「上一节的位置」写到「新小节」头上。
// 同理，点练习/考试时它也会被改成考试小节，而 moment 还是视频的位置。
let loadedSectionId = '';
// 上一次「补发进度」的时间戳，用于给 pause / visibilitychange 去重
// （这两个事件经常一起触发，没必要发两次）
let lastFlushAt = 0;
// 当前播放小节信息缓存 
const currentPlayData = reactive({
  courseId: route.query.id,    // 课程Id
  lastPlaySectionId: '', // 上一次播放的小节Id
  prevSectionId: '', // 上一个小节的id
  sectionId: '',  // 小节Id
  sectionName: '',
  nestSectionId: '', // 下一个小节的id
  moment: '', // 播放时间
  duration: '', // 总时长
  type: '', // 小节类型
  // 课表id（来自 /cs/courses/{id}/catalogs 的 lessonId）。必须在这里显式声明：
  // 不声明也能跑（Vue3 reactive 是 Proxy，赋值会动态加属性），但「声明了才有」比「运行时凭空冒出来」好排查。
  lessonId: '',
  // 当前所在章id，由 Catalogue 的 openCatalogue 回填
  chapterId: '',
})

provide('currentPlayData', currentPlayData)
//当前播放课程的全部信息
const learningClassDetails = ref()
const chapters = ref()
const sectionMap = ref({})
// 课程信息是否加载失败。失败时页面要给占位提示，而不是留一片空白
// （原来没有任何兜底，接口一挂就只剩白屏，用户完全不知道发生了什么）
const loadFailed = ref(false)
// 失败原因直接写进面板，替代原来那条一闪而过的 toast
const loadFailedMsg = ref('可能是网络异常或服务暂时不可用，请稍后重试')
// 播放签名/地址没拿到。单独一个状态是因为「课程信息拿到了但视频起不来」很常见
// （media 服务挂了），原来只弹一条 toast，视频区纯黑，用户以为页面卡死了。
const playFailed = ref(false)
const playFailedMsg = ref('')
// 课程已过期。原版学习页完全不校验课表状态 —— 过期的课只要收藏了链接、
// 或者从历史记录点进来，照样能拉到播放签名、把整门课看完。
// 这里在进页面时拦一道，不给「还能学」的错觉。
const expired = ref(false)
const expiredMsg = ref('')
// 已考完的小节id集合（统一转成字符串，雪花id在前端是字符串）
const finishedSectionIds = ref([])
// 拉取「已考完的小节id」。进页面拉一次，交卷返回目录时还要再拉一次 ——
// 只拉一次的话，交卷后目录用的仍是交卷前的快照，刚考完的节点打不上勾
const loadFinishedSections = () => {
  return getFinishedSections().then(r => {
    if (r.code === 200 && Array.isArray(r.data)) {
      finishedSectionIds.value = r.data.map(String)
    }
  }).catch(() => {})
}
// 该小节是否已考完（雪花id在前端是字符串，统一按字符串比）
const isSectionFinished = (item) => {
  return finishedSectionIds.value.some(id => String(id) === String(item.id))
}

// 页面初始化：拉课程信息 → 定位要播的小节 → 取播放签名。
// 抽成函数是为了让「加载失败 → 重新加载」按钮能复用同一段逻辑，避免两处走偏。
async function initPage() {
  detailsId.value = route.query.id  // 课程id

  // 使用课程id获取当前课程的细节
  await getLearningClassDetailsData()
  // ⚠️ 这里必须先判断「课程信息是否真的拿到了」再往下走。
  // 原来的写法是无条件读 learningClassDetails.value.latestSectionId —— 只要
  // /cs/courses/{id}/catalogs 返回非 200（例如它依赖的 exam-service 没启动，
  // course-service 里的 Feign 调用抛 UnknownHostException），learningClassDetails 就一直是
  // undefined，这一行直接 TypeError，整个学习页白屏、连「加载失败」都不给用户看。
  if (!learningClassDetails.value) {
    return
  }
  // 过期课程直接停在这里：不定位小节、不取播放签名，右侧目录还能看但不给播
  if (await checkLessonExpired()) {
    return
  }
  // 获取上次播放的小节及时间
  currentPlayData.sectionId = currentPlayData.sectionId || learningClassDetails.value.latestSectionId
  currentPlayData.moment =  currentPlayData.moment || learningClassDetails.value.moment
  // 通过课程的小节id获取视频的fileId
  if (await getMediasSignatureData(currentPlayData.sectionId)) {
    // 签名拿到、播放器开始加载这一节，之后才允许把进度上报到这个小节
    loadedSectionId = String(currentPlayData.sectionId)
  }
}
onMounted(initPage)
// 加载失败后的重试
const reload = () => {
  loadFailed.value = false
  expired.value = false
  initPage()
}

/**
 * 判断这门课是否已过期。
 *
 * 数据来源：`GET /ls/lessons/{courseId}`（课表详情），返回 status + expireTime。
 * 只在「有课表行」时才查 —— 目录接口的 lessonId 为空说明是免费试听，
 * 试听本来就没有有效期，不该被拦（这时查课表会直接 400「课程不存在」）。
 *
 * 判定用两个条件取「或」：
 *   · status = 3（EXPIRED）—— 由定时任务每小时刷一次，可能滞后
 *   · expireTime < now      —— 实时准，但依赖课表里真的写了过期时间
 * 只看 status 会有一段「已经过期、任务还没跑到」的空窗期，用户还能继续看。
 *
 * 查询失败（超时/断网）不阻断播放：这一层是「尽量拦一下」，
 * 拦错了把能学的课挡在门外，代价比漏拦大得多。
 */
const checkLessonExpired = async () => {
  if (!learningClassDetails.value || !learningClassDetails.value.lessonId) {
    return false
  }
  let res
  try {
    res = await getCourseLearning(detailsId.value)
  } catch (e) {
    return false
  }
  if (!res || res.code !== 200 || !res.data) {
    return false
  }
  const d = res.data
  const expireAt = d.expireTime ? new Date(d.expireTime).getTime() : 0
  const isExpired = Number(d.status) === 3 || (expireAt > 0 && expireAt < Date.now())
  if (!isExpired) {
    return false
  }
  expired.value = true
  expiredMsg.value = expireAt > 0
    ? `这门课程的有效期已于 ${formatDate(expireAt)} 结束，如需继续学习请重新购买`
    : '这门课程已失效，如需继续学习请重新购买'
  return true
}

// 过期提示里的日期：只到「天」，没必要把时分秒也甩给用户
const formatDate = (ts) => {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
// 使用课程id获取当前课程的细节
const getLearningClassDetailsData = async () => {
  await getLearningClassDetails(detailsId.value)
      .then((res) => {
        // 判空不能只判 code：课程不存在时后端会返回 code=200 + data=null
        if (res.code === 200 && res.data && Array.isArray(res.data.chapters) && res.data.chapters.length > 0) {
          // 将小节映射为id->小节的map
          res.data.chapters.forEach(c => c.sections.forEach(s => {
            sectionMap.value[s.id] = s
            s.hasTest=!!s.subjectNum;
          }));
          // 找到要播放的小节：优先是路径中指定的小节，如果没有则是最近学习的小节，如果还没有则是第一个小节
          let sId = route.query.sectionId || res.data.latestSectionId;
          let s = sectionMap.value[sId] || res.data.chapters[0].sections[0];
          res.data.latestSectionMoment = s.moment;
          res.data.latestSectionName = s.name;
          learningClassDetails.value = res.data;
          chapters.value = res.data.chapters;
          // 查已考完的小节id，给目录里的练习/考试节点打「已完成」的勾（拿不到就当作都没考）
          loadFinishedSections()
          // 缓存当前播放内容
          currentPlayData.duration = s.mediaDuration
          currentPlayData.sectionId = s.id;  // 小节Id
          currentPlayData.moment = s.moment || 0; // 播放时间
          currentPlayData.sectionName = s.name // 小节名称
          currentPlayData.type = s.type // 小节类型
          currentPlayData.lessonId = res.data.lessonId // 小节类型
          // 默认展开对应的章
          playId.value = currentPlayData.sectionId || ""
        } else {
          // 走到这里有两种情况，提示要分开：
          // ① 后端明确报错（code!=200）→ 用后端 msg，别自己编
          // ② code=200 但 data/chapters 为空（课程不存在、目录为空）→ 后端 msg 是 "OK"，
          //    直接展示会显示一个写着「OK」的错误，很怪
          loadFailed.value = true
          loadFailedMsg.value = res.code === 200 ? '课程数据异常，请稍后重试' : errMsg(res)
        }
      })
      .catch(() => {
        // 网络层失败（超时/断网）不会带业务体，只能给兜底文案
        loadFailed.value = true
        loadFailedMsg.value = '网络异常，请检查网络后重试'
      });
  store.setCurrentPlayData(currentPlayData)
};
// 课程上完了 弹窗 去个人中心
const classFinished = () => {
  ElMessageBox({
    title: '',
    message: h('div', null, [
      h('div', { style: 'display:flex' },
        [h('img', { src: icon, style: 'width:52px;height:52px;margin-right: 10px;' }),
        [h('div', null,
          [
            h('div', { style: 'font-size: 18px;font-weight: 500;' }, '你真棒！'),
            h('div', { style: 'line-height:30px' }, '所有内容全部学完，可以开始新的征程了~')
          ])
        ]
        ]
      ),

    ]),
    showCancelButton: false,
    confirmButtonText: '我知道了',
  })
    .then(() => {
      router.push('/personal/main/myClass')
    })
}
// 组件卸载的时候触发 - 页面跳转的时候触发
onUnmounted(() => {
  window.clearInterval(timer)
  // 路由跳走也要补发：原来只清定时器，用户点「返回」直接走人，最后一段进度就丢了
  flushPlayLog()
  // 学完一节，「最近学习」的进度/小节都变了，让共享缓存失效，
  // 免得 Header 的「继续学习」在 5 秒 TTL 内还指着上一节
  invalidateNowLesson()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pagehide', onPageHide)
})
const currentPlayTime = ref(0)
// 初始化视频播放器并播放视频 视频ID、播放器签名
const player = ref(null)

/**
 * 自动播放被浏览器策略拦下时的兜底。
 *
 * 没有用户交互（从收藏夹/直接输网址/刷新）就进页面时，`play()` 返回的 Promise 会被 reject
 * （NotAllowedError: play() failed because the user didn't interact with the document first）。
 * 原来 4 处都是裸调 `player.value.play()`，没人接这个 reject —— 结果是
 * `Uncaught (in promise)`，用户看到「视频不播 + 控制台报错」，还以为是页面坏了。
 *
 * 处理分两步（按浏览器策略的宽松程度）：
 *   ① 静音重试 —— 绝大多数浏览器允许「静音自动播放」，这一步通常就成功了；
 *   ② 静音也被拒 —— 弹「点击播放」遮罩，等一次真实点击（用户手势之后一定能播）。
 * 不直接吞异常：静默失败会让用户以为视频坏了。
 */
const autoplayBlocked = ref(false)

/**
 * 设置播放器静音。
 * ⚠️ TCPlayer 的静音是**方法** `player.muted(true/false)`，不是属性 ——
 *   写 `player.value.muted = true` 只是给实例挂了个无用字段，一点作用都没有（实测踩过）。
 * 双保险：原生 video 元素直接设 muted（一定生效），TCPlayer 的方法存在也调一下。
 */
const setPlayerMuted = (muted) => {
  const pl = player.value
  if (pl && typeof pl.muted === 'function') pl.muted(muted)
  const videoEl = document.querySelector('video')
  if (videoEl) videoEl.muted = muted
}

const safePlay = () => {
  const pl = player.value
  if (!pl) return
  const p = pl.play()
  // TCPlayer 的 play() 在部分版本返回 undefined，只有真返回 Promise 才需要接
  if (!p || typeof p.catch !== 'function') {
    autoplayBlocked.value = false
    return
  }
  p.then(() => {
    // 播起来了就把遮罩收掉（重试/切小节后上一轮留下的遮罩不能一直挡着）
    autoplayBlocked.value = false
  }).catch(() => {
    // 第一次被拒：多数浏览器的策略是「静音可以自动播」，静音重试一次
    if (!player.value) return
    setPlayerMuted(true)
    const retry = player.value.play()
    if (!retry || typeof retry.catch !== 'function') return
    retry
      .then(() => {
        // 静音播起来了。必须告诉用户一声 —— 视频在放但没声音，很容易被当成「音频坏了」
        ElMessage({ message: '已静音自动播放，点击播放器音量按钮可开启声音', type: 'info', grouping: true })
      })
      .catch(() => { autoplayBlocked.value = true })
  })
}

// 用户点了「点击播放」遮罩 —— 这时候已经有一次真实交互，正常情况下一定能播
const playByUserGesture = () => {
  const pl = player.value
  if (!pl) return
  autoplayBlocked.value = false
  setPlayerMuted(false)
  const p = pl.play()
  if (!p || typeof p.catch !== 'function') return
  p.catch(() => {
    // 真实点击后仍然播不了（极少见：源挂了、解码失败）。把遮罩放回去，
    // 否则用户点了没反应、遮罩还消失了，比不显示更让人困惑
    autoplayBlocked.value = true
  })
}

const initPlay = (fileID, psign) => {
  player.value = new TCPlayer(videoRef.value, {
    appID: PLAYER_APP_ID,
    fileID,
    psign,
    posterImage: true,
    autoplay: true,
    preload: 'auto',
    hlsConfig: {},
  });
  player.value.on('timeupdate', function () {
    // 换源期间旧视频的 timeupdate 不作数，见 switchingSection 的注释
    if (switchingSection) return
    currentPlayData.moment = player.value.currentTime();
    currentPlayTime.value = currentPlayData.moment
  });
  player.value.on('pause', function () {
    // 每次视频暂停的时候 停止发送播放记录请求
    window.clearInterval(timer)
    playing = false;
    // 暂停时补发最后一次进度。只清定时器不 flush 的话，用户「看一会儿 → 暂停 → 关掉」
    // 会丢掉最多 15 秒；下一次打开就从更早的位置续播。
    // 换源途中的 pause（loadVideoByID 会触发）由 flushPlayLog 内部的守卫挡掉。
    flushPlayLog()
  });
  player.value.on('play', function () {
    if(playing) return;
    playing = true;
    finished.value = false;
    if (!currentPlayData.lessonId) {
      // 免费试看，无需记录播放进度
      return;
    }
    addPlayLogHandle()
    // 每次视频播放的时候 开始 发送播放记录
    timer = window.setInterval(addPlayLogHandle, 15000)
  });
  player.value.on('ended',  () =>{
    // 播放结束时 停止计算器 并提交最后一次播放状态
    window.clearInterval(timer)
    //timer = 0;
    // 续播下一个
    finished.value = true;
  });
  // 签名拿到了、但视频流本身拉不到（OSS 桶权限变了、URL 过期、播到一半断网）。
  // 这种情况视频区只剩一片纯黑，只有播放器自己吐的报错，用户以为页面卡死。
  // 和「拿不到签名」共用同一个面板 —— 原因不同，但用户要做的事一样：知道出事了 + 能重试。
  player.value.on('error', (err) => {
    // 只在看视频时才有意义，练习/考试页不该弹这个
    if (pageType.value !== 1) return
    // hls 内部会连续重试几次，别让后面的报错把已经写好的原因冲掉
    if (playFailed.value) return
    const code = err && (err.code || err.errorCode)
    playFailedMsg.value = code
      ? `视频播放出错（错误码 ${code}），请稍后重试`
      : '可能是网络异常或视频源不可用，请稍后重试'
    playFailed.value = true
    // 换源途中出错时 seekAndPlay 的兜底定时器还在跑，这里顺手复位，
    // 否则 switchingSection 卡在 true，timeupdate 被永久屏蔽、进度不再更新
    switchingSection = false
  });
  player.value.ready(() => {
    window.clearInterval(timer)
    player.value.currentTime(currentPlayData.moment || 0)
    safePlay()
  })
}

// 目录、问答、笔记滚动（列表一次性返回全部数据，无需分页，这里只是 v-infinite-scroll 的占位回调）
const load = () => {}
const t = (n) => {
  return n < 10 ? '0'+n : n;
}
const now = () => {
  let d = new Date();
  return d.getFullYear() + "-" + t(d.getMonth() + 1) + "-" +t(d.getDate()) +
      " " + t(d.getHours()) + ":" + t(d.getMinutes())+":" + t(d.getSeconds());
}

// 播放新的小节的时候提交相关记录
const addPlayLogHandle = () => {
  let {lessonId, sectionId, moment, duration} = currentPlayData;
  // 上报播放进度；失败不影响播放，静默忽略
  addPlayLog({lessonId, sectionId, moment, duration, sectionType: 1, commitTime: now()})
      .catch(() => {});
};

/**
 * 补发一次当前进度（暂停 / 切走标签页 / 关页面时调用）。
 *
 * 为什么需要它：定时上报是 15 秒一次，而 `pause`、`onUnmounted` 原来只 `clearInterval`
 * 不 flush，于是「看了一会儿直接暂停关掉」会丢掉最多 15 秒进度。
 * 关标签页更糟：连 pause 都不一定触发，只能靠 visibilitychange / pagehide。
 *
 * @param keepalive 页面是否正在卸载。卸载时普通 XHR 会被浏览器直接取消，
 *                  必须用 fetch 的 keepalive 让请求在页面销毁后继续发出去。
 */
const flushPlayLog = (keepalive = false) => {
  // 1. 只在「正在播视频」时补发：练习/考试页的 sectionId 已经换成考试小节，moment 还是视频位置
  if (pageType.value !== 1) return
  // 2. 换源途中（sectionId 已是新小节、视频还在上一节）不能报
  if (switchingSection) return
  // 3. 免费试看没有课表id，不需要记录
  if (!currentPlayData.lessonId || !currentPlayData.sectionId) return
  // 4. 只补发「播放器真正加载着的那个小节」
  if (String(currentPlayData.sectionId) !== loadedSectionId) return
  // 5. moment 是 float，后端字段是 Integer，自己截断，别指望 Jackson 强转
  const moment = Math.floor(Number(currentPlayData.moment) || 0)
  if (moment <= 0) return
  // 6. pause 和 visibilitychange 常常前后脚触发，1 秒内只发一次
  const t = Date.now()
  if (t - lastFlushAt < 1000) return
  lastFlushAt = t

  const body = {
    lessonId: currentPlayData.lessonId,
    sectionId: currentPlayData.sectionId,
    moment,
    duration: currentPlayData.duration,
    sectionType: 1,
    commitTime: now(),
  }
  if (!keepalive) {
    addPlayLog(body).catch(() => {});
    return
  }
  // 页面卸载中：绕过 axios（拦截器/超时逻辑在卸载阶段都不可靠），用 keepalive 直接发
  try {
    fetch(`${API_HOST}/ls/learning-records`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        authorization: getToken() || '',
      },
      body: JSON.stringify(body),
    }).catch(() => {})
  } catch (e) {
    // 浏览器不支持 keepalive 之类，忽略：丢最后一次进度不影响播放
  }
};

// 页面被切走 / 关闭时补发进度。
// visibilitychange → hidden 是最可靠的时机：桌面切标签、手机切后台、关闭页面都会触发；
// pagehide 作为兜底（部分浏览器走 bfcache 时只触发它）。
const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') flushPlayLog(true)
}
const onPageHide = () => flushPlayLog(true)
onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
})

// 通过课程的小节id获取视频的fileId
const getMediasSignatureData = async (sectionId) => {
  // ⚠️ 必须自己兜住异常：这个函数是在 onMounted 里 await 的，
  // 一旦请求 reject（超时/断网）就会变成「未捕获的 promise 异常」，页面看起来是莫名其妙地停住。
  let res
  try {
    res = await getMediasSignature({sectionId})
  } catch (e) {
    // 不再弹 toast：视频区的占位面板会常驻显示同一条原因，弹窗属于重复播报
    playFailedMsg.value = '获取播放地址失败，请检查网络后重试'
    playFailed.value = true
    return false;
  }
  if (res.code === 200 && res.data) {
    playFailed.value = false
    fileId.value = res.data.fileId
    signature.value = res.data.signature
    if (player.value == null) {
      initPlay(res.data.fileId, res.data.signature)
    }
    return true;
  } else {
    playFailedMsg.value = errMsg(res, '获取播放地址失败')
    playFailed.value = true
    return false;
  }
};

// 视频区的「重新加载」：只重取播放签名，不重拉整个课程目录（课程信息本来就是好的）
const retrying = ref(false)
const retryPlay = async () => {
  if (retrying.value) return
  retrying.value = true
  const seekTo = Number(currentPlayData.moment) || 0
  playFailed.value = false
  // 重试前先记住播放器是不是已经存在：
  //   - 已存在 → getMediasSignatureData 只更新 fileId/signature，不会重新拉流，
  //     所以下面必须自己 loadVideoByID 一次（原来这里就结束了，面板消失、画面还是黑的）
  //   - 不存在 → getMediasSignatureData 内部会 initPlay，TCPlayer 构造时就带着新
  //     fileID 拉流了，此时再 loadVideoByID 等于同一个源连拉两次
  const hadPlayer = !!player.value
  const ok = await getMediasSignatureData(currentPlayData.sectionId)
  if (ok && hadPlayer && player.value) {
    reloadCurrentVideo(seekTo)
  }
  retrying.value = false
};

/**
 * 重新拉一次当前视频源，并把进度还原到刚才的位置。
 * 和 playHadle 里换源那段看着像，但没有复用：那边还要处理「连点多个小节」的序号问题，
 * 这里只有「重试当前这一节」一种场景，混在一起容易把已经调好的换源流程改坏。
 */
const reloadCurrentVideo = (seekTo) => {
  let done = false
  const seekAndPlay = () => {
    if (done) return
    done = true
    const duration = player.value.duration() || 0
    // 进度可能比视频时长还大，夹一下，否则 seek 到末尾会直接触发 ended
    const target = duration > 0 ? Math.min(seekTo, Math.max(duration - 1, 0)) : seekTo
    if (target > 0) player.value.currentTime(target)
    safePlay()
  }
  player.value.one('loadedmetadata', seekAndPlay)
  // 兜底：多节共用一个 fileID 时换源可能不再触发 loadedmetadata，1.5 秒后手动补一次
  window.setTimeout(seekAndPlay, 1500)
  player.value.loadVideoByID({
    appID: PLAYER_APP_ID,
    fileID: fileId.value,
    psign: signature.value,
  })
}

// 点击小节
const playHadle = async (val) => {
  const {item, tp} = val
  // 过期课程：目录还能翻，但任何「开始学习」的动作都要拦住 ——
  // 否则用户在目录里点一节，照样能取到签名把视频播起来，绕过了入口的校验
  if (expired.value) {
    ElMessage({ message: '课程已过期，无法继续学习', type: 'warning', grouping: true })
    return
  }
  if(tp == 0){
    finished.value = false;
    ElMessage.success("本章学习完毕，做做练习吧")
    return
  }
  // 练习返回（交卷成功后回到目录）
  if(tp == '9'){
    // 交卷刚落地一条考试记录，必须重拉一次已考完的小节，
    // 否则目录里用的还是进页面时那份快照，刚考完的考试节点不会打勾
    await loadFinishedSections()
    pageType.value = 1;
    return 
  }
  // 点的是不是「正在播的这一节」，必须在覆盖 sectionId 之前判断。
  // 原来写的是 item.id === currentPlayData.id —— 这个对象上根本没有 id 字段（只有 sectionId），
  // 恒为 false，于是「点当前小节」也会重新换源，位置回退到上一次上报的进度（最多差 15 秒）。
  const isSameSection = String(item.id) === String(currentPlayData.sectionId)
  // 覆盖前把三个字段都存一份。下面有几条「拦下来不切」的路径（已考完、签名失败），
  // 原来只把 sectionId 退回去了，name/duration 留在被改过的值上 ——
  // 表现是标题已经变成新小节、画面还停在旧小节，而且 15 秒后的进度上报
  // 会把旧小节的进度记到新小节头上。
  const prevSectionId = currentPlayData.sectionId
  const prevSectionName = currentPlayData.sectionName
  const prevDuration = currentPlayData.duration
  const restorePrev = () => {
    currentPlayData.sectionId = prevSectionId
    currentPlayData.sectionName = prevSectionName
    currentPlayData.duration = prevDuration
  }
  // 小节名称
  currentPlayData.sectionName = item.name
  // 更新currentPlayData 提交播放记录使用
  currentPlayData.sectionId = item.id  // 小节Id
  currentPlayData.duration = item.mediaDuration // 总时长
  // ⚠️ moment 只在「真的要换源」时才覆盖成 item.moment。
  // 点的是当前这一节时不能覆盖 —— item.moment 是进页面时拿到的快照，可能比实际落后 15 秒，
  // 覆盖后再 play() 会立刻把旧进度上报回去，等于把用户的进度往回滚。
  // 视频播放
  if (tp == '1') {
    pageType.value = 1
    if (isSameSection) {
      // 视频没起来时 player 是 null（media 挂了 / 签名失败），裸调 play() 会 TypeError。
      // 点的是当前这一节，那就当「重试」处理 —— 重新取签名并拉流。
      if (player.value) {
        safePlay()
      } else {
        retryPlay()
      }
    } else {
      let r = await getMediasSignatureData(item.id)
      if(!r){
        // 签名没拿到（未购买/试看被拒/网络异常）时播放器还停在上一节，
        // 这里必须把改掉的字段全部退回去，否则 15 秒后的上报会把「上一节的位置」记到「这一节」头上
        restorePrev()
        // 上一次换源如果被这次点击打断，它的 seek 回调会因为序号不匹配直接 return，
        // 不会再把标志复位；这里兜一下，否则 timeupdate 会被永久屏蔽、进度不再更新
        switchingSection = false
        return;
      }
      currentPlayData.moment = item.moment
      // ⚠️ 不能在 loadVideoByID 之后立刻 currentTime：换源是异步的，
      // 这一次 seek 打在「还没被替换掉的旧视频」上，等新视频加载完播放位置又回到 0，
      // 表现就是「点目录切到别的小节时永远从头播」。
      // 正确顺序：先注册 loadedmetadata（新视频的时长已就绪），再换源，事件到了才 seek + play。
      // 注意 moment 是小节自己的进度字段（item.latestSectionMoment 是课程级字段，小节上没有）。
      const seekTo = Number(item.moment) || 0
      // 连点多个小节时，只有最后一次的 seek 该生效：
      // 每次换源都留了 1.5 秒兜底定时器，不加序号的话，前一次的定时器会把「新视频」seek 到「上一节的位置」。
      const seq = ++switchSeq
      let seeked = false
      const seekAndPlay = () => {
        if (seeked || seq !== switchSeq) return
        seeked = true
        // 进度可能比新视频时长还大（换过视频源/时长变更），夹一下，
        // 否则 seek 到末尾会直接触发 ended，用户看到的是「点开就播完」
        const duration = player.value.duration() || 0
        const target = duration > 0 ? Math.min(seekTo, Math.max(duration - 1, 0)) : seekTo
        if (target > 0) {
          player.value.currentTime(target)
        }
        switchingSection = false
        // 到这里新视频才真正就位，之后的上报才允许记到这个小节头上
        loadedSectionId = String(currentPlayData.sectionId)
        safePlay()
      }
      // 先注册再换源，避免 loadedmetadata 比注册还快
      player.value.one('loadedmetadata', seekAndPlay)
      // 兜底：多节共用一个 fileID 时（本项目就是这样），换源可能不再触发 loadedmetadata，
      // 1.5 秒后还没 seek 就手动补一次，避免视频停在 0 秒不动
      window.setTimeout(seekAndPlay, 1500)
      switchingSection = true
      player.value.loadVideoByID(
          {
            appID: PLAYER_APP_ID,
            fileID: fileId.value,
            psign: signature.value,
          }
      )
    }
  } else if (tp == '2' || tp == '3') {
    // 暂停视频。视频没起来时 player 是 null（media 挂了 / 签名失败），
    // 原来这里裸调 pause() 会抛 TypeError，把下面整段考试流程全打断 ——
    // 表现就是「点练习没反应」，而且界面上什么都不显示，只有 console 里一行红字。
    // 练习/考试跟播放器没关系，不该被视频状态阻断。
    player.value && player.value.pause()
    // 打开练习题 开始考试
    if (item.type != 2 ){
        // 已经考过的不放行：后端 assertNotExamined 也会拦，这里提前拦掉，
        // 避免 pageType 已经切成 2 之后请求失败、停在空白答题页上
        if (isSectionFinished(item)) {
          // 拦下来不切页，但上面已经把 sectionId/name/duration 改成考试小节了，
          // 不还原的话标题会变成考试名、进度也会记到考试小节上
          restorePrev()
          ElMessage.warning('该考试已参加过，不能重复考试')
          return
        }
        ElMessageBox.confirm(
        `温馨提示：考试只能考一次，提交后不能重考；中途退出不占用考试次数，可以重新进入。确认考试请点击 继续考试`,
        '确认考试',
          {
            confirmButtonText: '继续考试',
            cancelButtonText: '等会再来',
            type: 'warning',
          }
        )
        .then(() => {
          startExaminationHandle(item)
        })
      } else {
        startExaminationHandle(item)
      }
    }
  store.setCurrentPlayData(currentPlayData)
}

// 考试开始时提交
const examInfo = ref({})
const startExaminationHandle = (item) => {
  examInfo.value = {
    sectionId: item.id, // 小节id
    type: item.type - 1,  // 类型，1-练习，2-考试  item.type对应章节的类型，2-视频（小节），3-考试
    courseId: currentPlayData.courseId,
    // 课表id：来自 /cs/courses/{id}/catalogs 的 lessonId，已在 getLearningClassDetailsData 里缓存。
    // 不传的话后端只能落 0，考试记录就丢了「学的是哪门课」这个信息
    lessonId: currentPlayData.lessonId,
  }
  pageType.value = 2;
}

// 答题出错的时候
const errorHandle = (val) => {
  pageType.value = 1
}

// 目录 - 打开一个章列表
const openCatalogue = (item) => {
  currentPlayData.chapterId = item
}

// table切换 目录、问答、笔记
const actId = ref(1)
const changeTable = id => {
  actId.value = id
}
// 关闭目录
const isClose = ref(false);
const close = () => {
  isClose.value = true
}
// 打开目录
const open = () => {
  isClose.value = false
}
// 返回上一页
const goBack = () => {
  window.clearInterval(timer);
  timer = 0;
  router.go(-1)
}
//收藏
</script>
<style lang="scss" src="./index.scss"></style>
