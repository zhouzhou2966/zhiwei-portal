<!--
  领券翻卡浮层。

  替代原来的「优惠券领取成功」纯文字 toast。rich 档的完整时序（数值 = 常量，别照抄旧注释）：
    0ms          遮罩淡入 + 卡片弹入 + 光环亮起 + 一声「吸气」（playCharge）
    0~560ms      卡背站着抖光，金箔反光从左上扫到右下（BURST_MS = 560）
    560ms        蓄力顶一下 → 金光炸开 + 粒子四散 → 开始 3D 翻转
    560~1380ms   翻转，末端减速收尾（FLIP_MS = 820）
    1085ms       券面逐行浮现（FLIP_MS × 0.64）+「叮」+ 轻震动 + 面额滚动
    1380ms       两个出口按钮淡入，焦点落到「开心收下」
    之后         卡片静止，不再跟随指针（倾斜层已拆除，原因见 toggleMute 上方的注释）

  粒子起跑点是 560ms，不是 0ms —— 之前的注释写成 0ms，照着它调参会在
  「300ms 看不到纸屑」上白查一轮（真实原因只是还没到发射时机）。

  ⚠️ 三个必须守住的约束（改之前先读）：
  1. 卡片祖先上不能出现 opacity < 1 / filter / backdrop-filter / overflow != visible。
     这些都是 CSS 的「grouping property」，会把子孙的 preserve-3d 降级成 flat，
     表现是翻转变成「瞬间换图」，很难排查。所以遮罩的淡入只作用在 .cf-veil 自己身上，
     stage 的入场只用 translateY，绝不加 opacity。
  2. 领券接口是 void + MQ 异步落库，浮层里展示的券信息来自列表数据，不能回查「我的优惠券」。
  3. 关闭时一定要清 rAF、移除 keydown、恢复 body 滚动，否则连续领券会叠定时器 + 页面卡死滚动。
-->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="rootRef"
      class="cf-root"
      :class="['fx-' + FX_LEVEL, { 'is-flying': flying, 'is-taking': taking }]"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
      tabindex="-1"
    >
      <!-- 遮罩单独一层：只让这一层做 opacity 动画，避免污染卡片的 3D 上下文 -->
      <div class="cf-veil" @click="onDismiss"></div>

      <!-- 纸屑画布铺满整屏、且压在 stage 之下：
           纸屑要能飘出卡片边缘，但落在卡片范围内的那些被卡片挡住，
           读起来是「从卡片后面撒出来的」，不会糊住券面文字。
           DOM 顺序决定层叠（这里在 stage 之前 = 在它下面），不用 z-index 打架。

           ⚠️ 这里不能挂 v-show / v-if 控制显隐（踩过）：
           startParticles() 第一步就要 getBoundingClientRect() 取画布尺寸算发射原点，
           而 display:none 的元素没有布局盒，量出来恒为 0×0，函数会在「尺寸非法」的
           守卫处直接 return —— 连带把「置为显示」那句也跳过，于是画布永远不显示、
           向量尺寸永远停在 canvas 默认的 300×150。整个粒子层成了死代码。
           现在让画布常驻（.cf-root 本身是 v-if，浮层关掉就一起卸载，没有长期开销），
           不播时靠 stopParticles() 清空像素即可；它 pointer-events:none，不挡交互。 -->
      <canvas ref="canvasRef" class="cf-particles" aria-hidden="true"></canvas>

      <!-- 飞行副本：从列表卡的位置和尺寸出发，落到卡片最终位置。
           只有背景和边框，没有内容 —— 这 340ms 用户要看的是「那张卡在过来」，
           不是读字；文字要等到位后由真卡片的卡背负责。 -->
      <div v-if="flying" class="cf-fly" :style="flyStyle" aria-hidden="true"></div>

      <div class="cf-stage" :class="{ 'is-entering': stageIn }">
        <button
          class="cf-mute"
          type="button"
          :aria-label="muted ? '开启音效' : '关闭音效'"
          :aria-pressed="muted"
          @click="toggleMute"
        >
          <svg v-if="!muted" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M4 9.5v5h3.6L12 18V6L7.6 9.5H4z" fill="currentColor" />
            <path d="M15.4 8.9a4.6 4.6 0 0 1 0 6.2M18 6.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M4 9.5v5h3.6L12 18V6L7.6 9.5H4z" fill="currentColor" />
            <path d="M15.6 9.6l4.4 4.8M20 9.6l-4.4 4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>

        <button class="cf-close" type="button" aria-label="关闭" @click="onDismiss">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <p v-if="coupons.length > 1" class="cf-counter">{{ index + 1 }} / {{ coupons.length }}</p>

        <!-- 两层光环：外圈扩散光斑压底，细金环在前，单层会显得「糊」 -->
        <span class="cf-halo" :class="{ 'is-on': haloOn }" aria-hidden="true"></span>
        <span class="cf-halo-ring" :class="{ 'is-on': haloOn }" aria-hidden="true"></span>

        <div ref="stageRef" class="cf-perspective" :class="{ 'is-settled': settled, 'is-charging': charging }">
          <div ref="cardRef" class="cf-card" :class="{ 'is-open': isOpen }">
            <div class="cf-face cf-face--back">
              <!-- 背面：深蓝底 + 金色斜纹 + 双线金框。翻转过程中这半秒唯一能看的东西，不能只是纯色 -->
              <span class="cf-back-glow" aria-hidden="true"></span>
              <!-- 金箔反光：翻之前在卡背上扫一道，把「这张卡有东西」的悬念顶起来 -->
              <span class="cf-back-shine" aria-hidden="true"></span>
              <span class="cf-seal">知微</span>
              <p class="cf-back-copy">恭喜获得</p>
              <!-- 这里原来还有一行「轻触开启」。删掉的原因是它写了一个不存在的操作：
                   卡背只停留 0.9 秒就自动翻开，用户根本不需要碰，文案在教人做一个用不上的动作。
                   而且真按提示去点，点到的其实是左上角静音键和右上角关闭键。
                   金线留下：它在标题下方作为收尾装饰是成立的，不是悬空的分隔符。 -->
              <span class="cf-back-line"></span>
            </div>

            <div class="cf-face cf-face--front" :class="{ 'is-revealed': revealing }">
              <!-- 券面装饰层：中心暖光 + 烫金内框。翻转时先看到「一张金卡」，内容再浮现 -->
              <span class="cf-front-glow" aria-hidden="true"></span>
              <span class="cf-front-frame" aria-hidden="true"></span>
              <img v-if="faceImage" :src="faceImage" class="cf-face-img" alt="" @error="imageFailed = true" />
              <template v-else-if="current">
                <!-- 三段式：上区 / 虚线 / 下区。上下区按 1.5 : 1 分剩余高度，
                     虚线才会稳定落在 58% 附近 —— 之前所有内容挤在一个 flex 流里居中，
                     虚线位置由「上半部分有几个字」决定，券名短的时候能飘到 69%，
                     下半截就剩两行字挂在半空。 -->
                <div class="cf-front-zone cf-front-zone--top">
                  <span class="cf-front-eyebrow">恭 喜 获 得</span>
                  <p class="cf-front-head">{{ copy.title }}</p>
                  <div class="cf-front-amount">
                    <span v-if="face.symbol" class="cf-front-symbol">{{ face.symbol }}</span>
                    <em>{{ shownAmount }}</em>
                    <span v-if="face.unit" class="cf-front-unit">{{ face.unit }}</span>
                  </div>
                  <span class="cf-front-ornament" aria-hidden="true"></span>
                  <p class="cf-front-rule" v-if="copy.rule">{{ copy.rule }}</p>
                </div>
                <span class="cf-front-split" aria-hidden="true"></span>
                <div class="cf-front-zone cf-front-zone--bottom">
                  <p class="cf-front-term">{{ termText }}</p>
                  <p class="cf-front-scope">{{ scopeLine }}</p>
                </div>
              </template>
            </div>
          </div>

          <!-- 去处提示：卡片缩走之后，用户要知道「这张券去哪了」。
               放在 perspective 内部而不是 stage 上，这样它天然对齐卡片区域，
               不用按视口比例去猜卡片中心在哪。 -->
          <p v-if="taking" class="cf-take-tip">已存入我的优惠券</p>
        </div>

        <div class="cf-actions" :class="{ 'is-on': settled }">
          <button ref="safeBtnRef" type="button" class="cf-btn cf-btn--ghost" @click="onTake">开心收下</button>
          <button type="button" class="cf-btn cf-btn--primary" @click="onUse">去使用</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { parseDate } from '@/utils/date'
import { couponCopy, couponFace, isLowEndDevice, prefersReducedMotion } from '@/utils/couponEffect'
import { couponScopeText, loadCategoryMap } from '@/utils/couponScope'
import { haptic, isMuted, playCharge, playReveal, setMuted, stopSound } from '@/utils/couponSound'

/**
 * 动画档位：
 *   'calm' —— 光环 + 3D 翻转，约 1.4s（稳，但只有「翻一下」，缺惊喜感）
 *   'rich' —— 光环 + 粒子爆发 + 扫光 + 券面逐行浮现，约 2.0s（对齐参考帖子的完整版）
 * 只改这一行即可切档，粒子参数已经调好，不是留着的死代码。
 */
const FX_LEVEL = 'rich'

const FLIP_MS = 820      // 翻转时长。别再往下调：卡背的「存活时间」由这条时长 × 曲线共同决定，
                         // 光看这个数会误判（旧版 780ms 里其实只有 69ms 能看到卡背，见下方曲线注释）
const FLY_MS = 340       // 列表卡飞到浮层位置用时。再长用户会开始等，再短看不出「是这张卡」
const TAKE_MS = 480      // 收下时卡片「被收走」的时长。必须和 CSS 的 cf-take 动画一致
const BURST_MS = 560     // 翻转前的蓄力：背面站着抖光，让人先「看到」再翻开
                         // 340ms 时金箔反光才扫到一半就翻走了，等于白做；560ms 够反光扫完 + 读完「恭喜获得」

const props = defineProps({
  visible: { type: Boolean, default: false },
  // 一次可能多张，逐张翻；当前业务一次只领一张，传长度为 1 的数组
  coupons: { type: Array, default: () => [] },
  // 预留：卡面图地址（未来 coupon 表加字段后由父组件传入），为空走默认卡面
  cardImage: { type: String, default: '' },
  // 列表卡的视口坐标（{left, top, width, height}）。传了就先播一段「卡片飞过来」，
  // 再开始蓄力翻卡；不传（直接调用、刷新后重开）则按老样子从中心弹出
  originRect: { type: Object, default: null },
})
const emit = defineEmits(['update:visible', 'use', 'closed'])

const index = ref(0)
const isOpen = ref(false)
const settled = ref(false)
// 券面内容浮现的开关，比 settled 早一步。
// 原因：翻转曲线末端是减速收尾（零速落定），从 20° 摆到 0° 要花约 0.25s，
// 如果等 settled 才浮现内容，这段「已经正对但还是一片空白」就会显得卡住。
// 拆成两个状态后：内容在卡片快转正时开始浮现，按钮仍然等完全落定再出。
const revealing = ref(false)
// 蓄力：翻转前卡片先「顶一下再缩回去」，没有这一下，背面那 340ms 就是干等
const charging = ref(false)
const haloOn = ref(false)
const imageFailed = ref(false)
const canvasRef = ref(null)
const rootRef = ref(null)
const stageRef = ref(null)
const cardRef = ref(null)
const safeBtnRef = ref(null)
// 飞行副本：把「列表里那张卡」按真实坐标接到浮层卡片的位置上（见 startFly 注释）
const flying = ref(false)
const flyStyle = ref({})
// 舞台入场动画开关。有飞行副本时必须关掉（理由见 .cf-stage.is-entering 的注释）
const stageIn = ref(false)
// 收下动画进行中：卡片缩小收走 + 去处提示淡入，走完才真正关浮层
const taking = ref(false)
// 音效开关：初值从 localStorage 读，用户点过「静音」就一直静音（每次领券都要重新听一遍很烦）
const muted = ref(isMuted())

const current = computed(() => props.coupons[index.value] || null)
// 券名与规则行去重：运营把「满199减50」也写进 name 时，只展示一次条件（见 couponCopy）
const copy = computed(() => couponCopy(current.value || {}))
// 对话框的无障碍名称。原来写死「领取优惠券」，但浮层出现时券**已经领完了**，
// 读屏用户听到的操作语义（去领取）和界面内容（恭喜获得）是相反的。
// 这里改成按券名播报，并带上「第几张」——一次领多张时能听出进度。
const ariaLabel = computed(() => {
  if (!current.value) return '恭喜获得优惠券'
  const total = props.coupons.length
  const tail = total > 1 ? `，第 ${index.value + 1} 张，共 ${total} 张` : ''
  return `恭喜获得优惠券：${copy.value.title}${tail}`
})
const face = computed(() => couponFace(current.value || {}))
// 券面底部的使用范围：原来是写死的「仅限本平台课程使用」，
// 但限定券是按三级分类配的（coupon_scope），写死等于把真实范围藏起来了
const categoryMap = shallowRef(new Map())
const scopeLine = computed(() => {
  const text = couponScopeText(current.value || {}, categoryMap.value)
  return text === '全部课程' ? '全部课程通用' : `仅限 ${text}`
})
const faceImage = computed(() => (props.cardImage && !imageFailed.value ? props.cardImage : ''))

const termText = computed(() => {
  const c = current.value
  if (!c) return ''
  if (c.termDays) return `领取后 ${c.termDays} 天内有效`
  if (c.termEndTime) return `有效期至 ${parseDate(c.termEndTime).format('YYYY-MM-DD')}`
  return ''
})

// 只读一次：setup 在挂载时执行，之后系统设置变化到下次打开浮层才生效，够用
const reduced = prefersReducedMotion()
// 券面面额的显示值。默认就是最终值（reduced-motion、calm 档、动画中断都不会显示错数字），
// rich 档在券面浮现时才从 0 滚上去。
const shownAmount = ref('')

let timers = []
let flyTimer = 0
let takeTimer = 0
let rafId = 0
let countRaf = 0
let scrollLocked = false
let prevOverflow = ''

const pushTimer = (fn, ms) => {
  timers.push(window.setTimeout(fn, ms))
}
const clearTimers = () => {
  timers.forEach(window.clearTimeout)
  timers = []
}

/**
 * 「列表卡飞过来」这一段。
 *
 * 为什么值得单独做：直接弹出的话，用户点的是列表里那张卡，出现在屏幕中央的却是另一张，
 * 视线要跳一次，仪式感的前提「你熟悉的东西开始变化」就断了。
 *
 * 实现上只能用**独立副本**，不能直接给 .cf-card 加 transform 过渡，原因有两个：
 *  1. 卡片在 .cf-perspective 的 3D 上下文里，translate/scale 会被透视投影改写，落点算不准；
 *  2. 列表卡是横版（宽扁），浮层卡是竖版 4:5，用 scale 过渡会把圆角一起拉成椭圆。
 * 所以副本走 left/top/width/height 过渡 —— 只有单个 fixed 元素重排，代价可以接受，
 * 而且圆角、金框都能保持真实比例。
 *
 * ⚠️ 副本消失的瞬间必须和真卡片**完全对齐**（同位置、同尺寸、同配色），
 *    否则会闪一下。副本的终点直接取 .cf-card 的 getBoundingClientRect()，配色抄卡背。
 */
function startFly() {
  const el = cardRef.value
  const o = props.originRect
  // reduced: 系统开了「减少动态效果」就直接出卡，不能因为多了个飞行把这条通道堵掉
  if (reduced || !el || !o || !o.width) { play(); return }
  const target = el.getBoundingClientRect()
  // 量不到有效尺寸（刚挂载还没布局 / 卡片被 display:none）就退回原来的弹出
  if (!target.width || !target.height) { play(); return }

  flyStyle.value = {
    left: `${o.left}px`,
    top: `${o.top}px`,
    width: `${o.width}px`,
    height: `${o.height}px`,
    borderRadius: '8px',
  }
  flying.value = true

  // 两帧：第一帧提交起点，第二帧改目标值，浏览器才会走过渡（同一帧改会被合并成最终态）
  let done = false
  const finishFly = () => {
    if (done) return
    done = true
    if (flyTimer) {
      window.clearTimeout(flyTimer)
      flyTimer = 0
    }
    flying.value = false
    play()
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    flyStyle.value = {
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      borderRadius: '18px',
    }
    // 交接必须等过渡真的跑完，不能拍脑袋卡在 FLY_MS。
    // 实测：rAF 双帧 + 首帧合成会让过渡晚约 30ms 启动，只靠定时器切的话，
    // 那一刻副本还差 40px（宽 270 vs 300），卡片会「跳」一下才到位 —— 正是这条动画要消灭的东西。
    const ghost = document.querySelector('.cf-fly')
    if (ghost) ghost.addEventListener('transitionend', finishFly, { once: true })
  }))

  // 兜底：过渡被打断 / 元素被移除 / 浏览器不派发 transitionend 时也能收尾
  flyTimer = window.setTimeout(finishFly, FLY_MS + 220)
}

/** 播放一轮：背面朝上 → (粒子/光环) → 翻转 → 停稳出按钮 */
function play() {
  clearTimers()
  stopParticles()
  stopCountUp()
  isOpen.value = false
  settled.value = false
  revealing.value = false
  charging.value = false
  haloOn.value = false
  imageFailed.value = false
  // 走完飞行后进来的一定是 false；这里兜底，防止中途关闭留下「卡片隐形」的状态
  flying.value = false
  taking.value = false
  // 先落到最终值：reduced-motion / calm 档 / 中途关闭都靠这个值兜底，不会显示成 0
  shownAmount.value = face.value.amount

  if (reduced) {
    isOpen.value = true
    revealing.value = true
    settled.value = true
    focusSafe()
    return
  }

  // ⚠️ 必须等一帧：第一帧提交「背面朝上」的初始态，第二帧再改 class。
  //    同一帧里同时设初始值和目标值，浏览器会把它们合并，transition 不触发（表现为直接闪现）。
  //    再挂一个 80ms 兜底：后台标签页 / 无头浏览器里 rAF 会被暂停，
  //    只靠 rAF 会让动画永远停在背面（用户切回来才继续，看起来像卡死）。
  let started = false
  const begin = () => {
    if (started) return
    started = true
    haloOn.value = true
    charging.value = true
    if (FX_LEVEL === 'rich' && !isLowEndDevice()) startParticles()
    // 声音和光环同时起：那半秒的「吸气」声就是让用户把视线挪回卡片的那一下
    playCharge()

    pushTimer(() => { charging.value = false }, BURST_MS)
    pushTimer(() => { isOpen.value = true }, BURST_MS)
    // 券面内容在「卡片转过约 75%、已经是 20° 左右的偏角」时就开始浮现，
    // 而不是等完全落定。翻转末端是减速收尾，最后 20° 要摆 0.25s ——
    // 等 settled 才浮现的话，这 0.25s 用户看到的就是一张正对但空白的卡。
    // 音效和震动跟着内容走，不跟着按钮走：它们对应的是「你看到券了」，不是「可以点了」。
    pushTimer(() => {
      revealing.value = true
      playReveal()
      haptic()
      // 这里不停粒子：彩带比翻转长（1500ms vs 1380ms），让它自然飘完，
      // 券面浮现时还在落纸屑，画面不会「啪一下安静」。关闭时 close() 会兜底清掉。
      if (FX_LEVEL === 'rich') pushTimer(runCountUp, 180)
    }, BURST_MS + FLIP_MS * 0.64)
    // 按钮仍等完全落定（含 cf-settle 的缩放）再出，否则会跟「卡片还在摆正」抢注意力
    pushTimer(() => {
      settled.value = true
      focusSafe()
    }, BURST_MS + FLIP_MS)
  }
  requestAnimationFrame(() => requestAnimationFrame(begin))
  pushTimer(begin, 80)
}

/**
 * 面额从 0 滚到目标值（easeOutCubic，560ms）。
 * 只处理纯数字（"50" / "8.5" / "85.00"），保留原小数位；
 * 卡面 em 上配了 tabular-nums，否则每一位宽度不同，滚动时整行会左右抖。
 */
function runCountUp() {
  stopCountUp()
  const raw = String(face.value.amount || '')
  const target = Number(raw)
  if (!raw || !Number.isFinite(target) || target <= 0) {
    shownAmount.value = raw
    return
  }
  const decimals = (raw.split('.')[1] || '').length
  const fmt = (v) => (decimals ? v.toFixed(decimals) : String(Math.round(v)))
  const DURATION = 560
  shownAmount.value = fmt(0)
  const started = performance.now()
  const tick = (now) => {
    const p = Math.min((now - started) / DURATION, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    shownAmount.value = p < 1 ? fmt(target * ease) : fmt(target)
    if (p < 1) countRaf = requestAnimationFrame(tick)
    else countRaf = 0
  }
  countRaf = requestAnimationFrame(tick)
}

function stopCountUp() {
  if (countRaf) cancelAnimationFrame(countRaf)
  countRaf = 0
}

function focusSafe() {
  // focusVisible: false —— 默认焦点是为了让键盘用户能直接回车/空格关闭，
  // 但程序化 focus 在 Chrome 里会被判成 focus-visible，导致鼠标用户也看到一圈
  // 金色描边 + 按钮自身边框叠成的双框。关掉它，键盘 Tab 进来时仍会正常出环。
  nextTick(() => safeBtnRef.value?.focus({ preventScroll: true, focusVisible: false }))
}

/* ===== 焦点陷阱 =====
 *
 * 浮层声明了 aria-modal="true"，但对键盘/读屏用户来说「模态」必须靠代码兑现：
 * 之前按 Tab 会一路走到浮层背后首页的课程卡、Header 链接上，焦点跑丢在
 * 一层半透明遮罩下面，用户既看不见焦点在哪，也退不出来（Esc 还能关，但那是运气）。
 *
 * 这里的做法是最小实现：Tab 时把候选焦点限制在浮层内、首尾循环。
 * 不引入 focus-trap 之类的库 —— 这个浮层只有 4 个可聚焦元素，
 * 库的体积和它自己那套 tabbable 判定带来的意外，比这里 20 行更贵。
 */
function trapTab(e) {
  const root = rootRef.value
  if (!root) return
  // 只认「真的能被看见且能用」的元素：
  //  - offsetWidth/Height 过滤 display:none
  //  - visibility 过滤翻转前那批 visibility:hidden 的按钮
  //  - pointer-events 过滤还没出场的按钮区（.cf-actions 在 settled 之前是 opacity:0 +
  //    pointer-events:none，但它有尺寸、也能接焦点 —— 不拦的话动画这 1.4s 里按 Tab
  //    会把焦点放到两个看不见的按钮上）
  const nodes = [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => {
      if (el.disabled) return false
      if (!el.offsetWidth && !el.offsetHeight) return false
      const cs = getComputedStyle(el)
      return cs.visibility !== 'hidden' && cs.pointerEvents !== 'none'
    })
  if (!nodes.length) {
    // 一个可聚焦元素都没有：这种情况真的会发生 —— 飞行副本那 340ms 里舞台是
    // visibility:hidden（用 visibility 不用 opacity，是为了不弄平卡片的 3D，见模板注释），
    // 静音键和关闭键一起被过滤掉。实测过：不处理的话这期间按 Tab 焦点会跑到
    // 背后首页的导航链接和搜索框上，用户在一层正在变暗的遮罩下面丢焦点。
    // 所以这里不 preventDefault 直接放行，而是把焦点压回对话框容器本身（tabindex=-1），
    // 让焦点留在浮层内、等元素出场后自然接上。
    e.preventDefault()
    root.focus({ preventScroll: true })
    return
  }
  const first = nodes[0]
  const lastEl = nodes[nodes.length - 1]
  const active = document.activeElement
  // 焦点已经在浮层外（比如刚打开、或鼠标点过遮罩）：直接收回来，别顺着 DOM 顺序乱跳
  if (!root.contains(active)) {
    e.preventDefault()
    ;(e.shiftKey ? lastEl : first).focus()
    return
  }
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault()
    lastEl.focus()
  } else if (!e.shiftKey && active === lastEl) {
    e.preventDefault()
    first.focus()
  }
}

/* ===== 音效开关 =====
 *
 * 曾经做过一版「卡片跟着指针倾斜 + 高光跟随」（react-tilt 那套 --rx/--ry/--mx/--my），
 * 后来整层拆掉了，原因不是实现 bug，是观感代价：
 *  1. perspective 下做 rotateX/rotateY，卡片会被当成纹理重新采样，子像素抗锯齿失效，
 *     券名和面额的笔画边缘发虚 —— 用户的评价是「整张卡片软软的」；
 *  2. 要避免「拖拽感」就必须每帧 lerp，而 lerp 系数一低就有 100ms 以上的跟随滞后，
 *     指针动得快时卡片是在「追」指针，物理上就是果冻；
 *  3. 静态的券面本来就有足够的层次（三层底纹 + 烫金内框 + 外溢光），倾斜没带来新信息。
 * 结论：这类「跟随指针」的小动作在信息型弹层上是负收益，不要再加回来。
 */
function toggleMute() {
  muted.value = !muted.value
  setMuted(muted.value)
  // 这里曾经播一声 playReveal 当「已开启」的确认，但那是「获得奖励」的音效，
  // 语义不对，而且 0.52s 的双击在反复点开关时非常吵。
  // 开关的反馈交给图标切换（喇叭 / 喇叭叉）+ :active 缩放就够了，声音只在领券落定时出现。
}

/** 收下 / 关闭：还有下一张就翻下一张，否则播「收进券包」再关浮层 */
function onTake() {
  if (index.value < props.coupons.length - 1) {
    index.value += 1
    play()
    return
  }
  // 收下是这个浮层的「正结局」，值得一个收尾动作。
  // 原来点完卡片整层直接消失，用户拿不到「这张券去哪了」的答案；
  // 现在卡片缩成一个小方块收走，同时把去处写出来。
  // reduced-motion 跳过：480ms 的缩小对一个明确不想看动效的人是负担。
  if (reduced || taking.value) {
    close('take')
    return
  }
  taking.value = true
  takeTimer = window.setTimeout(() => {
    takeTimer = 0
    close('take')
  }, TAKE_MS)
}

/** 点遮罩 / Esc：取消式关闭，不播收入动画 —— 那不是「收下了」，别给正反馈 */
function onDismiss() {
  if (index.value < props.coupons.length - 1) {
    index.value += 1
    play()
    return
  }
  close('dismiss')
}

function onUse() {
  // 先关浮层再通知父组件跳转：父组件会 router.push，组件随后被卸载，
  // 如果先 push 再 close，close 里的 emit 就落在已卸载的父组件上，状态收不干净。
  const target = current.value
  close('use')
  emit('use', target)
}

function close(reason) {
  if (takeTimer) {
    window.clearTimeout(takeTimer)
    takeTimer = 0
  }
  clearTimers()
  stopParticles()
  stopCountUp()
  // 铃尾 1.25s 比浮层的寿命长：点「开心收下」后浮层 0.5s 就没了，
  // 不收的话会出现「浮层已关闭，声音还在响」，像声音找不到主人。
  // 90ms 淡出而不是硬切，硬切会有「咔」的爆音（原因见 couponSound.js#stopSound）。
  stopSound()
  emit('update:visible', false)
  emit('closed', reason)
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    onDismiss()
    return
  }
  if (e.key === 'Tab') trapTab(e)
}

function lockScroll() {
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  scrollLocked = true
}

function unlockScroll() {
  if (!scrollLocked) return
  document.body.style.overflow = prevOverflow
  scrollLocked = false
}

// 分类树和浮层一起加载：用户点「立即领取」时大概率已经回来了，券面上就能直接显示分类名
onMounted(() => {
  loadCategoryMap().then((map) => {
    categoryMap.value = map
  })
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      index.value = 0
      lockScroll()
      window.addEventListener('keydown', onKeydown)
      // 有飞行副本就不放入场动画：飞行本身就是入场，而且 stage-in 的 scale(0.9)
      // 会让 startFly 量到偏小的落点。必须在 DOM 渲染前定好，否则动画已经开跑了。
      stageIn.value = !props.originRect
      // 父组件在同一个 tick 里改 visible 和 coupons，等它同步完再播
      nextTick(() => {
        // 先把焦点收进浮层容器：飞行/翻转前面那几百毫秒舞台还不可见，
        // 焦点如果留在 body 上，Tab 会先顺着背后的页面走。
        rootRef.value?.focus({ preventScroll: true })
        // 有来源坐标就先飞一段再翻，没有就按原来的直接弹
        if (props.originRect) startFly()
        else play()
      })
    } else {
      unlockScroll()
      window.removeEventListener('keydown', onKeydown)
      clearTimers()
      stopParticles()
      stopCountUp()
      // 飞行途中被关掉：定时器不清的话，几百毫秒后会在已关闭的浮层上再触发一次 play()
      if (flyTimer) {
        window.clearTimeout(flyTimer)
        flyTimer = 0
      }
      flying.value = false
      stageIn.value = false
    }
  },
  { immediate: true }
)

/**
 * 彩带 + 星芒。
 *
 * 参数体系借鉴 canvas-confetti（github.com/catdad/canvas-confetti）的思路：
 * 不按「固定轨迹」画，而是给每片纸屑一个初速度，然后每帧做三件事 ——
 * 重力积分、指数衰减、横向摆动。这样落点是物理推出来的，
 * 不会像解析式那样「所有纸片走同一条抛物线，只是角度不同」。
 *
 * 相比上一版的三处改动，都是观感上的硬差距：
 *  1. 两波发射：中心炸开 46 片（全向）+ 左下/右下各 18 片斜向上喷（彩带炮）。
 *     单波全向散开只有「炸一下」，两波才有「从两边庆祝」的现场感。
 *  2. 画布从卡片大小扩到整屏：纸屑要能飘出卡片、落到按钮下方才像真的。
 *  3. 三种形状混排：方纸片、细长纸条、四角星芒。全是矩形会像马赛克。
 */
function startParticles() {
  const canvas = canvasRef.value
  const stage = stageRef.value
  if (!canvas) return
  // 幂等：重复调用会叠出两条 rAF 循环，两边各自 clearRect + 各算一套物理，
  // 表现为纸屑数量翻倍并高频闪烁。先收掉上一条。
  if (rafId) stopParticles()
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  // 发射原点取「卡片」的位置，不是画布中心：浮层在窄屏上卡片偏上，按钮在下面
  const cardRect = stage ? stage.getBoundingClientRect() : rect
  const cx = cardRect.left + cardRect.width / 2 - rect.left
  const cy = cardRect.top + cardRect.height * 0.42 - rect.top

  const GOLD = ['#F7DC9E', '#EFC871', '#D9A441', '#FFF3D8', '#C8933A']
  // 背面用暗一档的同色系：翻过来时能看出「这是纸的背面」，不是同一个颜色在闪
  const GOLD_BACK = ['#D9A441', '#B07C22', '#C8933A']
  // 少量品牌深蓝混进去。全金会糊成一片暖色，缺对比；蓝金是这套 UI 的既有配色
  const NAVY = ['#1B4B6B', '#2A6C8E']
  const GRAVITY = 780       // px/s²，比真实的 9.8「重」很多，动画时间尺度下才落得下去
  const LIFE = 2.1          // 单片纸屑存活秒数
  // 速度衰减系数（exp(-DECAY*t)），数值越大越快「停住」。
  // 1.9 是画布只有卡片大小时定的：那时纸屑只要离开卡片中心一点点就出画布边缘，
  // 衰减快反而显得利落。画布扩到整屏后同一个值变成了「走不出去」——
  // 最大行程只有 v/DECAY ≈ 121~326px，而卡片半宽就有 150px。
  // 1.35 把行程拉到 207~519px，纸屑才能真正散到卡片轮廓之外。
  const DECAY = 1.35

  const rnd = (a, b) => a + Math.random() * (b - a)
  const pick = (arr) => arr[(Math.random() * arr.length) | 0]

  const pieces = []

  /** 造一片纸屑。delay 让两波发射错开，形状按概率抽 */
  function spawn(x, y, angle, speed, delay) {
    const roll = Math.random()
    // 方纸片 55% / 细纸条 30% / 星芒 15%
    const kind = roll < 0.55 ? 'rect' : roll < 0.85 ? 'ribbon' : 'star'
    const base = rnd(0.85, 1.25)
    const navy = Math.random() < 0.16
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: kind === 'ribbon' ? rnd(2.4, 3.6) * base : rnd(4, 8) * base,
      h: kind === 'ribbon' ? rnd(12, 20) * base : rnd(5, 10) * base,
      kind,
      rot: rnd(0, Math.PI * 2),
      vrot: rnd(-6, 6),
      // 翻面相位：cos 从 1 到 0 再回来，就是纸片正面 → 侧棱 → 背面
      flip: rnd(0, Math.PI * 2),
      vflip: rnd(4, 11),
      // 横向摆动：真实纸片下落时左右飘，直线下落会像「掉帧」
      swayA: rnd(30, 90),
      swayF: rnd(1.1, 2.4),
      swayP: rnd(0, Math.PI * 2),
      color: navy ? pick(NAVY) : pick(GOLD),
      color2: navy ? '#0F3247' : pick(GOLD_BACK),
      delay,
      life: LIFE * rnd(0.75, 1),
    }
  }

  // 第一波：沿卡片轮廓全向炸开。
  //
  // ⚠️ 原来是从卡片**中心** (cx, cy) 发射的，改掉的原因不是观感偏好，是算得出来的：
  //    指数衰减下纸屑的最大行程只有 v/DECAY，旧参数（v 230~620、DECAY 1.9）下是 121~326px，
  //    而卡片半宽 150px、上半高 157px —— 最慢那批横向根本走不出卡片，全程藏在卡背后；
  //    快的也没好到哪去：300ms 时只挪了约 0.2v ≈ 130px，还差一点才够到边缘。
  //    600ms 抓帧的实况是「卡片左右各 2~3 片刚要钻出来」，
  //    本该是「金光炸开」，读出来却是「从缝里渗出来」。
  //    改成沿轮廓发射后第一帧就贴在剪影上往外散，「从卡片后面撒出来」的读法反而更准
  //    （纸屑落点仍在卡片范围内，被挡住的部分由 DOM 层叠自然裁掉，不用额外做遮罩）。
  const ELL_RX = cardRect.width * 0.5
  const ELL_RY = cardRect.height * 0.5
  const ELL_CX = cx
  const ELL_CY = cardRect.top + cardRect.height / 2 - rect.top
  const N1 = 58
  for (let i = 0; i < N1; i += 1) {
    // 角度均分再加抖动：纯随机会在某个方向堆成一团，看起来像掉帧
    const a = (Math.PI * 2 * i) / N1 + rnd(-0.3, 0.3)
    // 半径抖到 0.82~1：全部贴着同一个椭圆会看到一圈「纸屑轮廓线」
    const k = rnd(0.82, 1)
    pieces.push(spawn(
      ELL_CX + Math.cos(a) * ELL_RX * k,
      ELL_CY + Math.sin(a) * ELL_RY * k,
      a,
      rnd(240, 680),
      0,
    ))
  }

  // 第二波：左右下角斜向上「彩带炮」，压 90ms 让中心先炸开
  const N2 = 18
  for (let i = 0; i < N2; i += 1) {
    const side = i % 2 === 0 ? -1 : 1
    const ox = cx + side * cardRect.width * 0.52
    const oy = cy + cardRect.height * 0.34
    // -110° ~ -70°（朝上），再往左右各偏 20°，两束往中间交汇
    const a = -Math.PI / 2 + side * rnd(0.16, 0.52)
    pieces.push(spawn(ox, oy, a, rnd(340, 760), 0.09))
  }

  // 少量星芒在爆点闪一下，给「金光炸开」一个锐利的高光点。
  // 和第一波同理，贴在轮廓上而不是卡片中心 —— 中心那颗星只会被卡片挡住，
  // 用户一次都没见过它（这 7 颗的任务就是「闪」，藏在后面等于没做）。
  for (let i = 0; i < 7; i += 1) {
    const a = rnd(0, Math.PI * 2)
    const p = spawn(
      ELL_CX + Math.cos(a) * ELL_RX * rnd(0.9, 1.02),
      ELL_CY + Math.sin(a) * ELL_RY * rnd(0.9, 1.02),
      a,
      rnd(160, 380),
      0,
    )
    p.kind = 'star'
    p.w = rnd(7, 13)
    p.h = p.w
    p.life = rnd(0.45, 0.8)
    p.starOnly = true
    pieces.push(p)
  }

  let last = performance.now()
  let t = 0

  const drawStar = (r) => {
    ctx.beginPath()
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4 - Math.PI / 2
      const rr = i % 2 === 0 ? r : r * 0.26
      const px = Math.cos(a) * rr
      const py = Math.sin(a) * rr
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }

  const tick = (now) => {
    // dt 封顶 50ms：切到后台再回来时 now 会跳很大，不封顶纸片会瞬移出屏
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    t += dt
    ctx.clearRect(0, 0, rect.width, rect.height)

    let alive = 0
    pieces.forEach((p) => {
      const lt = t - p.delay
      if (lt < 0 || lt > p.life) return
      alive += 1

      // 指数衰减：初速越大掉得越快，视觉上是「炸开后迅速被空气吃掉」
      const damp = Math.exp(-DECAY * lt)
      p.vy += GRAVITY * dt
      p.x += p.vx * damp * dt + Math.sin(lt * p.swayF + p.swayP) * p.swayA * dt
      p.y += p.vy * damp * dt
      p.rot += p.vrot * dt
      p.flip += p.vflip * dt

      const fade = lt > p.life * 0.62 ? 1 - (lt - p.life * 0.62) / (p.life * 0.38) : 1
      // 出场 80ms 内从 0 到 1，避免纸片「凭空出现」
      const appear = Math.min(lt / 0.08, 1)
      ctx.globalAlpha = Math.max(0, fade * appear)
      ctx.fillStyle = Math.cos(p.flip) >= 0 ? p.color : p.color2

      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.kind === 'star') {
        const r = p.w * 0.7 + 2
        ctx.rotate(p.rot * 0.3)
        ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.6 + 0.4)
        drawStar(r)
        // 爆点那几颗额外套一圈低透明度的大星，深色遮罩上才有「闪」的感觉
        if (p.starOnly) {
          ctx.globalAlpha *= 0.26
          drawStar(r * 1.9)
        }
      } else {
        ctx.rotate(p.rot)
        // 水平翻面：cos 从 1→0→-1，宽度随之收窄再张开，负半周就是背面
        ctx.scale(Math.cos(p.flip), 1)
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }
      ctx.restore()
    })

    if (alive > 0) rafId = requestAnimationFrame(tick)
    else {
      ctx.clearRect(0, 0, rect.width, rect.height)
      stopParticles()
    }
  }
  rafId = requestAnimationFrame(tick)
}

function stopParticles() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  // 画布现在是常驻的（不能靠 v-show 隐藏，原因见模板上那段注释），所以停止时必须
  // 显式擦掉最后一帧：否则从 stopParticles 到下一轮 startParticles 之间会残留上一轮纸屑，
  // 连续领第二张时表现为「新卡还没翻，旧纸屑还在飘」。
  const canvas = canvasRef.value
  const ctx = canvas && canvas.getContext('2d')
  // clearRect 走的是当前变换矩阵（startParticles 里 scale 过 dpr），
  // 这里故意传像素尺寸而不是 CSS 尺寸 —— 偏大只会多清一圈被裁掉的区域，不会漏清。
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
}

onBeforeUnmount(() => {
  clearTimers()
  stopParticles()
  stopCountUp()
  unlockScroll()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style lang="scss" scoped>
.cf-root {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  /* ⚠️ 这里不能加 backdrop-filter / filter / opacity，会打断卡片的 preserve-3d */

  /* 容器是可编程聚焦的（tabindex="-1"，焦点陷阱要在没有可聚焦子元素时把它压住），
     容器自己不出焦点环 —— 环留给真正的按钮。 */
  &:focus {
    outline: none;
  }
}

.cf-veil {
  position: absolute;
  inset: 0;
  /* 0.58 的纯色遮罩挡不住背后的内容：截图里那张红券和白卡透出来，
     和金色券面抢注意力。加深 + 背景模糊，主体才「浮」在暗处。
     backdrop-filter 必须放在这一层 —— 它是 .cf-stage 的兄弟节点而不是祖先，
     不会像加在 .cf-root 上那样把卡片的 preserve-3d 降级成平面。 */
  background: rgba(9, 22, 32, 0.72);
  animation: cf-veil-in 240ms ease-out both;

  /* 单独放在 @supports 里：不支持背景滤镜的浏览器上，
     模糊会整条失效、只剩 0.72 的纯色遮罩 —— 那也比半透明透出列表强。 */
  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    -webkit-backdrop-filter: blur(8px) saturate(0.8);
    backdrop-filter: blur(8px) saturate(0.8);
  }
}

.cf-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 入场动画不能无条件挂在 .cf-stage 上，否则会毁掉飞行：
   stage-in 的起始帧是 scale(0.9)，而「卡片飞过来」需要在飞行开始时量出卡片的**最终**位置。
   动画还在跑的时候量，拿到的是 0.9 倍的中途尺寸（实测 270×337，真值 300×375），
   副本就会飞向一个偏小的假目标，交接那一帧卡片会往外「跳」30px。
   所以改成 JS 按情况加：有飞行副本时跳过（飞行本身就是入场，不该再弹一次）。 */
.cf-stage.is-entering {
  /* 入场要「弹出来」而不是「滑进来」：只有 translateY 的话，
     卡片像是从下面被推上来，缺一个由小到大的爆发感。 */
  animation: cf-stage-in 420ms cubic-bezier(0.2, 0.85, 0.25, 1) both;
}

/* 飞行副本在空中时，整块 stage（卡片 + 两个角上的圆钮）先不画。
   两个原因：按钮会先弹出来而卡片还没到；卡片本身会和副本叠成两层。
   用 visibility 而不是 animation: none —— 后者一撤销就会让入场动画重播一遍；
   visibility: hidden 期间动画照常跑完，恢复可见时正好是最终态。
   ⚠️ 也不能用 opacity：opacity < 1 会把卡片的 preserve-3d 拍平，翻转变成瞬间换图。 */
.cf-root.is-flying .cf-stage {
  visibility: hidden;
}

.cf-mute {
  /* 和关闭按钮左右对称，都贴在卡片外角：两个都做成「浮在遮罩上」的小圆钮，
     读起来是一组工具，而不是卡片上多长了两颗东西。 */
  position: absolute;
  top: -12px;
  left: -12px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: rgba(12, 26, 38, 0.5);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition: background 160ms, border-color 160ms, color 160ms, transform 120ms;

  /* 开关没有声音反馈，按下去必须有点别的回执，否则会怀疑没点到 */
  &:active {
    transform: scale(0.9);
  }

  &:hover {
    background: rgba(12, 26, 38, 0.78);
    border-color: rgba(255, 255, 255, 0.7);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid rgba(217, 164, 65, 0.85);
    outline-offset: 2px;
  }
}

.cf-close {
  /* 贴在卡片右上角外侧 1/3 处。原来是 top:-44px，离卡片 44px 悬在遮罩上，
     大屏下会孤零零飘着，跟卡片读不成一组。 */
  position: absolute;
  top: -12px;
  right: -12px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
  /* 半透明深底：按钮已经压到卡片白面上，纯描边在白底上会看不见 */
  background: rgba(12, 26, 38, 0.62);
  color: #fff;
  cursor: pointer;
  transition: background 160ms, border-color 160ms;

  &:hover {
    background: rgba(12, 26, 38, 0.82);
    border-color: #fff;
  }

  &:focus-visible {
    outline: 2px solid rgba(217, 164, 65, 0.85);
    outline-offset: 2px;
  }
}

.cf-counter {
  position: absolute;
  top: -42px;
  left: 0;
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.cf-halo {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  border-radius: 50%;
  /* 从「一根细金线」换成「一团金光」：1px 圆环在深色遮罩上几乎看不出来，
     径向渐变能把卡片边缘压亮一圈，视线自然收到中心，这才是「炸开」的底光。 */
  background: radial-gradient(
    circle,
    rgba(245, 208, 130, 0.55) 0%,
    rgba(240, 196, 106, 0.18) 42%,
    rgba(240, 196, 106, 0) 70%
  );
  opacity: 0;
  pointer-events: none;

  &.is-on {
    animation: cf-halo 980ms ease-out both;
  }
}

/* 细金环：光斑负责「亮」，它负责「炸开」的方向感。
   只有光斑时画面是一团糊的暖雾，加一层从中心甩出去的环才有爆发力。 */
.cf-halo-ring {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border-radius: 50%;
  border: 1.5px solid rgba(247, 220, 158, 0.9);
  box-shadow: 0 0 22px rgba(240, 196, 106, 0.5), inset 0 0 18px rgba(240, 196, 106, 0.32);
  opacity: 0;
  pointer-events: none;

  &.is-on {
    animation: cf-ring 900ms cubic-bezier(0.16, 0.8, 0.3, 1) both;
  }
}

.cf-particles {
  /* 整屏：纸屑要能飘出卡片、落到按钮下面，才像「撒下来的」而不是「画在卡片上的」 */
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 飞行副本。
   用 left/top/width/height 做过渡而不是 transform，是因为列表卡是横的、浮层卡是竖的：
   scale 会连圆角一起拉成椭圆，而宽高过渡只是重排，圆角和金框始终是真实比例。
   只有一个 fixed 元素参与重排，代价可以接受。
   配色直接抄 .cf-face--back —— 副本消失、真卡片接手的瞬间必须看不出切换。 */
.cf-fly {
  position: fixed;
  z-index: 30;
  pointer-events: none;
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(100% 66% at 50% -10%, rgba(247, 220, 158, 0.34) 0%, rgba(247, 220, 158, 0) 62%),
    linear-gradient(165deg, #21556e 0%, #17405a 42%, #0c2836 100%);
  box-shadow:
    inset 0 0 0 1px rgba(217, 164, 65, 0.45),
    0 26px 64px rgba(9, 22, 32, 0.42),
    0 0 60px rgba(217, 164, 65, 0.16);
  /* 和 JS 的 FLY_MS（340）保持一致。曲线前段快、后段收，
     读起来是「被吸过来」而不是「匀速平移」 */
  transition:
    left 340ms cubic-bezier(0.22, 0.72, 0.2, 1),
    top 340ms cubic-bezier(0.22, 0.72, 0.2, 1),
    width 340ms cubic-bezier(0.22, 0.72, 0.2, 1),
    height 340ms cubic-bezier(0.22, 0.72, 0.2, 1),
    border-radius 340ms cubic-bezier(0.22, 0.72, 0.2, 1);
}

/* ===== 收下：卡片被「收走」 =====
   原来点完开心收下整层直接消失，用户拿不到「券去哪了」的答案。
   现在卡片先缩成一个小方块收走，同一位置浮出「已存入我的优惠券」，480ms 后才卸载浮层。

   这里可以放心用 opacity（不像别处必须避开）：收下之后不再需要翻转，
   preserve-3d 被拍平也无所谓。但它只作用在 .cf-card 自己身上，不含祖先。 */
.cf-root.is-taking .cf-card {
  /* 缩放原点放在底边中点：卡片缩小时底边原地不动、整体朝底部收，
     正好落在下面那行「已存入我的优惠券」上方。
     用中心缩放的话卡片会停在中间，和文字之间空出一大段，看着像两个不相干的元素。 */
  transform-origin: center bottom;
  animation: cf-take 480ms cubic-bezier(0.45, 0, 0.7, 0.24) both;
}

/* 三个出口先撤：卡片已经在收了，按钮还亮着会让人以为还能点 */
.cf-root.is-taking .cf-actions {
  opacity: 0;
  transform: translateY(6px);
}

.cf-root.is-taking .cf-mute,
.cf-root.is-taking .cf-close {
  opacity: 0;
  transition: opacity 180ms ease-out;
  pointer-events: none;
}

@keyframes cf-take {
  /* 起手先微微放大一下再收：直接缩小像「被删掉」，顶一下才像「被抽走」 */
  0%   { transform: rotateY(0deg) scale(1); opacity: 1; }
  22%  { transform: rotateY(0deg) scale(1.035); opacity: 1; }
  100% { transform: rotateY(0deg) scale(0.1); opacity: 0; }
}

/* 去处提示：贴在卡片区域的正下方，不压在正在缩小的卡面上。
   （之前试过居中，文字会正好盖住券名，读起来像给卡片贴了一张标签。） */
.cf-take-tip {
  position: absolute;
  left: 0;
  right: 0;
  /* 100% 是卡片区域底边；卡片是绕自身中心缩小的，所以底边往上收，不会和这里打架 */
  top: 100%;
  margin: 14px 0 0;
  text-align: center;
  pointer-events: none;
  /* 12.5px / 0.5px 字距：这句话会叠在正在缩小的卡片上，
     字号再大一档就会比卡片还宽，读起来像一条横幅压在卡上而不是「卡片去哪儿了」的注解 */
  font-size: 12.5px;
  letter-spacing: 0.5px;
  color: rgba(255, 249, 235, 0.94);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.62);
  /* 等卡片缩到一半再出，两个动作不抢同一段时间 */
  animation: cf-tip-in 280ms ease-out 200ms both;
}

@keyframes cf-tip-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}

.cf-perspective {
  position: relative;
  perspective: 1200px;
  perspective-origin: 50% 45%;

  /* 蓄力：先缩一点再顶起来，翻之前的这段就有了「要开了」的预感。
     时长跟 JS 的 BURST_MS（560）对齐，动画先走完、剩 40ms 静止，节奏才不拖沓 */
  &.is-charging {
    animation: cf-charge 520ms cubic-bezier(0.3, 0.7, 0.3, 1) both;
  }

  &.is-settled {
    animation: cf-settle 380ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
}

.cf-card {
  position: relative;
  width: min(78vw, 300px, 42vh);
  /* 4:5 而不是 3:4 —— 券面内容只有「券名 / 面额 / 规则 / 有效期」四项，
     3:4 下内容只占一半，垂直居中时上下各空出 70px 以上，看着像没渲染完。 */
  aspect-ratio: 4 / 5;
  transform-style: preserve-3d;
  /* 初始背面朝上（180deg），翻到 0 才是券面。
   *
   * 曲线是这条动画最关键的一处，比时长重要得多：
   * 旧版用 cubic-bezier(0.18, 1.16, 0.24, 1)，本意是「末端过冲到 0 再弹回来」，
   * 但 y1=1.16 / x1=0.18 让起步斜率变成 1.16/0.18 ≈ 6.4 倍 —— 转过 90°（卡背彻底看不见）
   * 只花了 69ms，而总时长写着 780ms。于是 88% 的时间都花在「背面朝后、什么都看不到」的半程，
   * 表现出来就是「卡背一闪而过，然后卡面慢悠悠转过来」。顺带一提，这个参数算出来的实际过冲
   * 只有 1.3°，肉眼根本看不见，等于两头都没拿到。
   *
   * ⚠️ 这里的 820ms 必须和 JS 的 FLIP_MS 一致：券面浮现的时机是
   *    BURST_MS + FLIP_MS * 0.64 算出来的，两边不同步会让内容在卡片还斜着时就冒出来。
   *
   * 现在换成起步慢、中段快、末端收的曲线：y1 压到 0.06（起步斜率 0.11），
   * 转过 90° 落在 333ms —— 卡背在翻转过程中有 0.3 秒可以被读到，而不是被甩掉。
   * 没有加过冲：真实卡片翻过来时手是压住的，回弹反而显得像塑料片。 */
  transform: rotateY(180deg);
  transition: transform 820ms cubic-bezier(0.55, 0.06, 0.22, 1);

  &.is-open {
    transform: rotateY(0deg);
  }
}

.cf-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* 面片自己是叶子节点，这里裁圆角不会影响 3D 上下文 */
  overflow: hidden;
}

.cf-face--back {
  transform: rotateY(180deg);
  /* 翻转那 820ms 里，用户看到的就是这一面。纯色会让「蓄力」显得很廉价，
     所以给它三层：顶部金色漏光 + 极细斜纹 + 深浅蓝渐变。
     斜纹透明度必须压到 0.02 以下 —— 白色压在深蓝上的对比远高于压在米白卡面上，
     同一个值在正面几乎看不见，在背面会变成斑马线。 */
  background:
    radial-gradient(100% 66% at 50% -10%, rgba(247, 220, 158, 0.34) 0%, rgba(247, 220, 158, 0) 62%),
    repeating-linear-gradient(46deg, rgba(255, 255, 255, 0.022) 0 1px, rgba(255, 255, 255, 0) 1px 9px),
    linear-gradient(165deg, #21556e 0%, #17405a 42%, #0c2836 100%);
  box-shadow:
    inset 0 0 0 1px rgba(217, 164, 65, 0.45),
    0 24px 60px rgba(9, 22, 32, 0.38),
    0 0 56px rgba(217, 164, 65, 0.13);

  /* 双线金框：真实卡面几乎没有单线的，两道框一粗一细就有「印制过」的质感 */
  &::before {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 11px;
    border: 1px solid rgba(217, 164, 65, 0.26);
    pointer-events: none;
  }
}

.cf-back-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  border-radius: 50%;
  /* 中心一团暖光 + 一圈放射光芒。深色卡背上没有点「光」的话会像一块纯色板，
     放射条用 mask 在边缘淡出，才不会像贴了张轮盘图。 */
  background:
    radial-gradient(circle, rgba(247, 220, 158, 0.18) 0%, rgba(247, 220, 158, 0) 66%),
    repeating-conic-gradient(
      from 0deg,
      rgba(247, 220, 158, 0.062) 0deg 2.4deg,
      rgba(247, 220, 158, 0) 2.4deg 15deg
    );
  /* 中心只给 32% 强度：卡背的文字和印章就在正中央，光芒全亮会糊在字上 */
  -webkit-mask-image: radial-gradient(circle, rgba(0, 0, 0, 0.32) 0%, #000 30%, #000 48%, rgba(0, 0, 0, 0) 74%);
  mask-image: radial-gradient(circle, rgba(0, 0, 0, 0.32) 0%, #000 30%, #000 48%, rgba(0, 0, 0, 0) 74%);
  pointer-events: none;
  /* 蓄力那半秒里光在慢慢涨，卡片「在呼吸」，等翻转时才有张力 */
  animation: cf-back-breathe 2400ms ease-in-out infinite;
}

/* 金箔反光：蓄力那半秒里从左上扫到右下。
   只在「背面朝上」时跑 —— .is-open 一挂上就停，等于「翻转那一刻把光收走」，
   读起来是光跟着卡片一起翻过去，而不是卡片上贴了一条会动的白带子。
   is-open 从 false→true→false 切换会让动画自然重播，连领第二张不用手动重置。 */
.cf-back-shine {
  position: absolute;
  top: -20%;
  left: -58%;
  /* 宽度只有卡片的 22%：再宽就成「贴了一块毛玻璃」，压住了卡背的印章和文字。
     真实金箔的反光是窄的一道，宽了反而不像光 */
  width: 22%;
  height: 140%;
  background: linear-gradient(
    100deg,
    rgba(247, 220, 158, 0) 0%,
    rgba(247, 220, 158, 0.14) 24%,
    rgba(247, 220, 158, 0.34) 42%,
    rgba(255, 250, 235, 0.52) 52%,
    rgba(247, 220, 158, 0.3) 62%,
    rgba(247, 220, 158, 0.1) 80%,
    rgba(247, 220, 158, 0) 100%
  );
  transform: rotate(12deg);
  opacity: 0;
  /* 3px 模糊把边缘的硬直线化开：只给 1px 时能看出「一个矩形在平移」 */
  filter: blur(3px);
  pointer-events: none;
}

/* 时长 460ms + 延迟 80ms = 540ms，必须压在翻转开始（BURST_MS=560）之前扫完，
   只留 20ms 静默收尾。否则 is-open 一到，这条规则就不再匹配、动画被直接抽走，
   表现是光扫到一半「啪」一下没了。
   反光跟着 BURST_MS 一起放慢：卡背站着的时间变长了，光还按原来的速度扫会显得「一闪就过」，
   而这段光本来就是让人把视线收回来的钩子。 */
.cf-card:not(.is-open) .cf-back-shine {
  animation: cf-back-sweep 460ms 80ms ease-out both;
}

.cf-seal {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(217, 164, 65, 0.65);
  border-radius: 8px;
  font-size: 13px;
  letter-spacing: 1px;
  color: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(217, 164, 65, 0.07), 0 6px 18px rgba(0, 0, 0, 0.22);
}

.cf-back-copy {
  position: relative;
  margin: 18px 0 0;
  font-size: 15px;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.82);
}

.cf-back-line {
  position: relative;
  margin-top: 20px;
  width: 54px;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(217, 164, 65, 0) 0%,
    rgba(217, 164, 65, 0.75) 50%,
    rgba(217, 164, 65, 0) 100%
  );
}

.cf-face--front {
  /* 米金纸面：顶部一层白柔光（像斜上方打灯）+ 极细斜纹（美术纸纤维）
     + 上浅下深的暖米色渐变。三层叠出来才有「卡纸」的重量，单色渐变一眼假。 */
  background:
    radial-gradient(112% 58% at 50% -8%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.42) 34%, rgba(255, 255, 255, 0) 70%),
    repeating-linear-gradient(118deg, rgba(190, 140, 55, 0.055) 0 1px, rgba(190, 140, 55, 0) 1px 7px),
    linear-gradient(168deg, #fffdf7 0%, #fffaee 40%, #faeeda 76%, #f5e4c4 100%);
  box-shadow:
    inset 0 0 0 1px rgba(196, 148, 64, 0.36),
    inset 0 0 26px rgba(217, 164, 65, 0.12),
    0 28px 66px rgba(9, 22, 32, 0.42),
    /* 一层很淡的金色外溢光：深色遮罩里没有它，卡片边缘会「贴」在背景上，
       有了这圈暖光才像被灯照着浮起来 */
    0 0 60px rgba(217, 164, 65, 0.15);
  padding: 26px 20px;
  text-align: center;
  /* 覆盖 .cf-face 的 center：三段式靠 zone 的 flex 分配高度，
     整体居中会让 zone 分不到确定的剩余空间，虚线又飘回去。 */
  justify-content: flex-start;

  /* 翻到位后一道斜向白光扫过券面。
     只在 rich 档出现：扫光需要「翻完再打光」的时序，calm 档节奏不到 1.2s，加上会显得忙。 */
  &::after {
    content: '';
    position: absolute;
    top: -30%;
    left: -45%;
    width: 38%;
    height: 160%;
    background: linear-gradient(
      100deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.86) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(14deg);
    opacity: 0;
    pointer-events: none;
  }
}

/* 三段式的上下两个区。
   两区都 flex:1 的「基准」，上区多拿 50%（1.5 : 1）：
   真券的金额区本来就更重，视觉重量和面积应该一致，而不是五五开。
   两区内部各自垂直居中 —— 券名两行还是一行，都不会把虚线的位置顶跑。 */
.cf-front-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1.5 1 0;
}

.cf-front-zone--bottom {
  flex: 1 1 0;
  /* 券名占两行 + 规则也长时，上区会被内容撑高、把下区压扁。
     40px 是两行 13px 文字的底线，保证虚线不会一直掉到卡片底边。 */
  min-height: 40px;
}

/* 券面中心暖光：把视线压在面额上，也把「金」这件事说清楚 */
.cf-front-glow {
  position: absolute;
  left: 50%;
  top: 40%;
  width: 250px;
  height: 250px;
  margin: -125px 0 0 -125px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(245, 208, 130, 0.26) 0%,
    rgba(245, 208, 130, 0.09) 46%,
    rgba(245, 208, 130, 0) 72%
  );
  pointer-events: none;
}

/* 烫金内框：和背面那圈呼应，卡片翻过来还是「同一张卡」 */
.cf-front-frame {
  position: absolute;
  inset: 9px;
  border-radius: 12px;
  border: 1px solid rgba(196, 148, 64, 0.26);
  pointer-events: none;
}

.cf-face-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 券面眉标：放在正常流里而不是绝对定位，顶部留白才由 padding 统一控制 */
.cf-front-eyebrow {
  position: relative;
  font-size: 11px;
  letter-spacing: 2px;
  color: #a9761c;
  /* 眉标两侧各一条渐隐短横，把「恭喜获得」框成一个抬头，而不是飘着的两个字 */
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &::before,
  &::after {
    content: '';
    width: 18px;
    height: 1px;
    background: linear-gradient(90deg, rgba(196, 148, 64, 0), rgba(196, 148, 64, 0.85));
  }

  &::after {
    background: linear-gradient(90deg, rgba(196, 148, 64, 0.85), rgba(196, 148, 64, 0));
  }
}

.cf-front-head {
  position: relative;
  margin: 14px 0 0;
  /* 券名是这张卡的主信息，15px 相对 56px 的金额太弱，提到 17px 撑住层级 */
  font-size: 17px;
  line-height: 1.45;
  color: var(--color-main);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cf-front-amount {
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 12px 0 8px;
  color: #a9761c;

  em {
    font-style: normal;
    font-size: 56px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -1.5px;
    /* 数字从 0 滚到目标值时，等宽数字才不会让整行左右抖 */
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    /* 金属渐变：上亮下暗再回亮，模拟镀金在光下的明暗变化。
       单一金色（#D9A441）在大字号下会显得像黄色色块，缺少「金属」的转折。 */
    background: linear-gradient(174deg, #e8c078 0%, #c08a2a 34%, #9c6a16 58%, #d9a441 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

.cf-front-symbol {
  margin-right: 3px;
  font-size: 22px;
  font-weight: 600;
  /* baseline 对齐时 ¥ 的底部贴着 56px 数字的基线，视觉上会「沉」在左下角。
     抬 4px 让它落在数字的上半段，和金额形成一体。 */
  transform: translateY(-4px);
}

.cf-front-unit {
  /* 和货币符号统一成 20px：18px 配 56px 的数字时「折」显得脱离，间距也会显大 */
  margin-left: 3px;
  font-size: 20px;
  font-weight: 600;
}

/* 券头装饰：一条渐隐线 + 中间小菱形，比直接接虚线更像「券」 */
.cf-front-ornament {
  position: relative;
  display: block;
  width: 78px;
  height: 1px;
  margin: 2px auto 0;
  background: linear-gradient(
    90deg,
    rgba(196, 148, 64, 0) 0%,
    rgba(196, 148, 64, 0.65) 50%,
    rgba(196, 148, 64, 0) 100%
  );

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    transform: rotate(45deg);
    background: #c8933a;
    box-shadow: 0 0 0 2px #fffaf0;
  }
}

.cf-front-rule {
  position: relative;
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #7a6440;
}

.cf-front-split {
  position: relative;
  /* 负 margin 抵消 face 的左右 padding，让虚线一直画到卡片边缘 ——
     真实券的虚线是「从左边咬口一路到右边咬口」，停在内边距处会留下 20px 空档，
     缺口就像两个孤立的点。配合 align-self:stretch（父级是 align-items:center，
     width:100% 在负 margin 下不会跟着变宽）。 */
  align-self: stretch;
  /* 纵向不留 margin：上下间距交给 zone 的居中留白，否则 flex 分配的空间
     会被 margin 吃掉一段，虚线又偏离 58%。 */
  flex: 0 0 auto;
  margin: 0 -20px;
  border-top: 1px dashed rgba(196, 148, 64, 0.42);

  /* 虚线两端各半个「咬口」。
     face 是 overflow:hidden，所以放在卡片边缘的圆会被裁成半圆 ——
     正好就是真实券被裁掉的那两个缺口，不需要真的挖洞。

     ⚠️ 这里的填充色换过四版，结论是「不能用渐变」：
       ① 深色实心 rgba(11,25,36,.86) —— 明度太低，读作「贴了两个黑点」；
       ② 金描边 —— 像两枚铜钉，更显眼；
       ③ 暖棕径向渐变（中心深、边缘渐淡）—— 8 倍放大下是个「凸起的球」：
          径向渐变的边缘变亮、融进纸面，视觉上等于一个半透明圆片鼓在卡边；
          而且卡片那 1px 金边从缺口上直接穿过去，真挖洞不会有这条线。
       ④ 现在：纯色 + 硬边，色值按「遮罩叠在纸面上应该得到什么」反解出来（见下方注释）。
          实心同时盖住卡片那 1px 金边，缺口才真的打断轮廓；硬边才读作「洞」，
          渐变边缘只会把它糊成「斑」。 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(9, 22, 32, 0.68);
    /* 0.78 是算出来的，不是凭感觉调的：要让洞的合成色等于「遮罩叠在页面上的颜色」，
       解 alpha·(9,22,32) + (1-alpha)·(250,245,235) = (63,74,86) 得 alpha ≈ 0.76~0.78。
       高于它洞会明显比背景黑（变成「贴了个深色圆片」），低于它洞会发灰发亮。
       注意这是近似值：遮罩带 backdrop-filter，真实背景色会随页面内容浮动几个色阶。
       不追求「真透明」是因为那要做 mask 挖洞 + 用 JS 把虚线的 y 位置写进 CSS 变量，
       为几阶色差引入布局耦合不值得。 */
  }

  /* split 现在铺到卡片边缘，所以圆心要落在 x=0 上：-6 + 12/2 = 0 */
  &::before {
    left: -6px;
  }

  &::after {
    right: -6px;
  }
}

/* 下半区只有两行，12px 撑不住 1/3 张卡的面积 —— 提到 13px 并收紧行距，
   让它读起来是「条款」而不是「脚注」。 */
.cf-front-term {
  position: relative;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #7a6440;
}

.cf-front-scope {
  position: relative;
  margin: 7px 0 0;
  font-size: 12px;
  color: #9a8358;
}

.cf-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 240ms ease-out, transform 240ms ease-out;
  pointer-events: none;

  &.is-on {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
}

.cf-btn {
  min-width: 116px;
  height: 42px;
  padding: 0 22px;
  border-radius: 21px;
  font-size: 14px;
  cursor: pointer;
  transition: background 160ms, color 160ms, border-color 160ms;

  &:focus-visible {
    outline: 2px solid rgba(217, 164, 65, 0.75);
    outline-offset: 2px;
  }
}

.cf-btn--primary {
  /* 和券面数字同一套金属逻辑：上亮下暗 + 顶部一道内高光。
     纯色 #D9A441 平铺在深色遮罩上会显得发闷，像一块塑料。 */
  border: 1px solid #d9a441;
  background: linear-gradient(180deg, #f7d891 0%, #e8bc63 48%, #d9a441 100%);
  color: #3b2a0c;
  box-shadow:
    0 8px 22px rgba(217, 164, 65, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.62);

  &:hover {
    background: linear-gradient(180deg, #ffe3a6 0%, #f0c878 48%, #e3b055 100%);
    border-color: #e3b055;
  }
}

.cf-btn--ghost {
  /* 三次改版的终点：
     ① 「白字 + 白描边」——浮在灰色遮罩上对比度只有 3:1，发虚；
     ② 「白底 + 深字」——对比度够了，但和金色主按钮并排时整块泛白，
        被读成 disabled（截图里确实像禁用态）；
     ③ 现在：半透明白底 + 白字 + 白描边。既压在遮罩上有足够对比，
        又用「不填满」的形状明确表达它是次要出口。 */
  border: 1px solid rgba(255, 255, 255, 0.62);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.26);
    border-color: rgba(255, 255, 255, 0.9);
  }
}

@keyframes cf-veil-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cf-stage-in {
  from { transform: translateY(20px) scale(0.9); }
  to { transform: none; }
}

@keyframes cf-charge {
  /* 用独立变换属性 scale 而不是 transform：transform 会和下面的 perspective
     抢同一个属性槽，某些浏览器组合下会把子元素的 preserve-3d 降级成平面，
     表现是翻转变成「瞬间换图」。scale 不参与这条链路。 */
  0% { scale: 0.97; }
  55% { scale: 1.035; }
  100% { scale: 1; }
}

@keyframes cf-halo {
  0% { opacity: 0.92; transform: scale(0.45); }
  70% { opacity: 0.26; }
  100% { opacity: 0; transform: scale(1.75); }
}

/* 环要「甩」出去：前 22% 快速放大到 0.9 倍，之后慢速飘出并淡掉。
   匀速放大会像涟漪，前快后慢才像冲击波。 */
@keyframes cf-ring {
  0% { opacity: 0; transform: scale(0.32); }
  22% { opacity: 1; transform: scale(0.92); }
  100% { opacity: 0; transform: scale(2.1); }
}

@keyframes cf-back-breathe {
  0%, 100% { opacity: 0.55; transform: scale(0.94); }
  50% { opacity: 1; transform: scale(1.06); }
}

/* 反光带从卡片左侧外扫到右侧外。
   位移用百分比是相对「元素自己」的宽度（只有卡片的 22%），
   所以要从 -58% 走到 108% 得平移约 760%，不是 120% */
@keyframes cf-back-sweep {
  0% { opacity: 0; transform: rotate(12deg) translateX(0); }
  16% { opacity: 1; }
  74% { opacity: 1; }
  100% { opacity: 0; transform: rotate(12deg) translateX(760%); }
}

@keyframes cf-settle {
  0% { transform: translateY(0); }
  35% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}

/* ===== rich 档：扫光 + 券面逐行浮现 + 按钮错峰 ===== */
.fx-rich {
  /* 翻转过程中先把内容藏起来：卡片转到一半就看得见券名，等于没翻 */
  .cf-front-eyebrow,
  .cf-front-head,
  .cf-front-amount,
  .cf-front-ornament,
  .cf-front-rule,
  .cf-front-split,
  .cf-front-term,
  .cf-front-scope {
    opacity: 0;
  }

  /* 逐行浮现：眉标 → 券名 → 面额 → 装饰线 → 规则 → 虚线 → 有效期 → 范围。
     间隔 40~90ms，总落差 380ms，眼睛会顺着从上往下读一遍。 */
  .cf-face--front.is-revealed {
    .cf-front-eyebrow  { animation: cf-front-in 360ms cubic-bezier(0.2, 0.8, 0.2, 1) 40ms both; }
    .cf-front-head     { animation: cf-front-in 400ms cubic-bezier(0.2, 0.8, 0.2, 1) 110ms both; }
    .cf-front-amount   { animation: cf-amount-in 480ms cubic-bezier(0.2, 0.9, 0.25, 1) 170ms both; }
    .cf-front-ornament { animation: cf-front-in 340ms ease-out 240ms both; }
    .cf-front-rule     { animation: cf-front-in 360ms cubic-bezier(0.2, 0.8, 0.2, 1) 270ms both; }
    .cf-front-split    { animation: cf-front-in 320ms ease-out 315ms both; }
    .cf-front-term     { animation: cf-front-in 340ms ease-out 352ms both; }
    .cf-front-scope    { animation: cf-front-in 340ms ease-out 392ms both; }
  }

  .cf-face--front.is-revealed::after {
    animation: cf-shine 760ms ease-out 60ms both;
  }
}

/* 两个出口不要同时蹦出来，主按钮晚 80ms，视线会先落在金色那颗上 */
.cf-actions.is-on .cf-btn {
  animation: cf-btn-in 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.cf-actions.is-on .cf-btn:nth-child(2) {
  animation-delay: 80ms;
}

@keyframes cf-front-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@keyframes cf-amount-in {
  0% { opacity: 0; transform: scale(0.72); }
  70% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes cf-btn-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@keyframes cf-shine {
  0% { opacity: 0; transform: translateX(0) rotate(14deg); }
  18% { opacity: 0.95; }
  100% { opacity: 0; transform: translateX(360%) rotate(14deg); }
}

/* 面额用的是「渐变文字」（background-clip: text + 透明字色）。
   不支持该属性的浏览器上，数字会变成完全透明 —— 直接看不见金额。
   这里退回实色金，宁可少一层质感，也不能丢信息。 */
@supports not (background-clip: text) {
  .cf-front-amount em {
    background: none;
    color: #b07c22;
  }
}

/* 系统开启「减少动态效果」时，CSS 层也把过渡关掉，和 JS 分支对齐 */
@media (prefers-reduced-motion: reduce) {
  .cf-card,
  .cf-actions {
    transition: none;
  }

  .cf-halo.is-on,
  .cf-halo-ring.is-on,
  .cf-back-glow,
  .cf-perspective.is-settled,
  .cf-perspective.is-charging,
  .cf-stage,
  .cf-veil {
    animation: none;
  }

  /* rich 档默认把券面内容藏起来等动画浮现，这里必须显式拉回可见：
     否则关掉动效的用户会看到一张空白卡（内容停在 opacity:0）。 */
  .fx-rich .cf-front-eyebrow,
  .fx-rich .cf-front-head,
  .fx-rich .cf-front-amount,
  .fx-rich .cf-front-ornament,
  .fx-rich .cf-front-rule,
  .fx-rich .cf-front-split,
  .fx-rich .cf-front-term,
  .fx-rich .cf-front-scope {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .fx-rich .cf-face--front::after,
  .cf-actions.is-on .cf-btn {
    animation: none;
  }

  .cf-back-shine {
    display: none;
  }
}
</style>
