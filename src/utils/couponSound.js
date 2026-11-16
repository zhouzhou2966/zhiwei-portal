/**
 * 领券音效：全部用 WebAudio 现场合成，不加载任何音频文件。
 *
 * 两个原因：一是省一个 http 请求（浮层才 1.9s，多一个 300KB 的 mp3 不划算），
 * 二是「奖励音」素材基本都有版权风险，合成出来的反而是独一份的。
 *
 * ── 音色演进：四版都记在这里，被否掉的原因比结论更值钱 ──
 *
 * v1（4 正弦分音 + 523Hz 垫底 + 4.2kHz 高通噪声）被否：2637Hz 纯正弦落在手机扬声器
 * 共振峰上会「吱」；±0.14% 失谐不产生金属感、只会在 0.9s 里拍频 1~2 次，听感是「音不准」；
 * 五个声源同时起，混成一团糊的嗡。
 *
 * v2（A5 → E6 纯五度，木琴包络）被否：技术上干净，但**语汇错**。
 * 五度上行双击 + 210ms 就衰完，正是手机系统提示音/小游戏过关音的样子，
 * 听到的是「叮咚」而不是「拿到东西」；放在一个成人向的学习产品上，显得廉价。
 * 频谱实测（runlogs/analyze-sound.mjs，Goertzel 1/3 倍频程 + 10ms 包络）：
 *   亮度重心 922Hz、-20dB 只用 210ms、-40dB 350ms → 短、亮、像提示音。
 *
 * v3（E4 → B4 温铃）：音色上改对了「暖」，三处做法保留到 v4：
 *  - 分音用玻璃棒的**非谐和**比例 2.41 / 3.9 倍（不是 2/4 倍这种整数倍），
 *    非谐和才像「被敲的固体」，整数倍听起来像风琴；
 *  - 第二个基音故意 +9 音分失谐：两者缓慢拍频约 5 次/秒，是玻璃「湿润」的来源。
 *    （v1 的错不在失谐本身，而在失谐量太小 + 音太高。）
 *  - 敲击音的音高在 10ms 内从略高滑回基频（pitch drop），否则起音「平」得像蜂鸣器。
 *  但两处实测问题没解决：
 *  - ≥2.5kHz 能量 0.0% —— 纯正弦堆不出这个频段，所以是「好听但不够爽」，
 *    缺了奖励感最关键的「到手」那一下锐度；
 *  - 亮度重心 421Hz、最强分音 317Hz —— 而手机小喇叭在 400Hz 以下滚降很明显，
 *    主音在小喇叭上几乎出不来，实际听到的只剩泛音，反而更像提示音。
 *
 * v4（现在这版，A4 → E5 + 微光瞬态）：
 *  - 音程关系沿用 v3 的**纯五度上行**（上行=正向、五度=确认达成；大三度太甜，听 40 次会腻）；
 *  - 整体上移纯四度到 440 / 659.25Hz，两个基音都落在手机小喇叭真正有效的 440~660Hz；
 *  - 每个音加一记 16ms 的 3kHz 带通噪声（sparkle），补上 2~4kHz 的锐度；
 *  - 尾巴收到 1.25s，-20dB 440ms，落在业界「庆祝档 400~600ms」的中间。
 * 实测：亮度重心 618Hz、≥2.5kHz 能量 1.6%、-20dB 440ms、峰值 -14.2dBFS（不削波）。
 * 最强分音 635Hz(E5) / 400Hz(A4) —— 两个都出得来，这是和 v3 最本质的差别。
 *
 * 参考依据（runlogs/render-sound.mjs + analyze-sound.mjs 可复现全部对比）：
 *  - 时长按事件量级分档：点按微反馈 50~120ms / 成功确认 200~400ms / 阶段庆祝 400~800ms。
 *    领券属于「庆祝」，所以 210ms 的 v2 一定是错的，问题在量级不在音高。
 *  - 语义靠音高方向而非音色；正向事件用协和音程上行。
 *  - 「为低质量手机扬声器设计」——不要依赖 400Hz 以下的能量。
 *  - 验收标准是「它第 40 次响起时的感受」，不是第一次。所以选了中性的五度而不是大三度。
 *
 * 两段声音：
 *   playCharge() —— 翻卡前 0.3s 的一声「沙」，低通噪声从 2.6k 扫到 700Hz，音量 0.05。
 *                  它是「注意力预告」，不该被听成「这里有音效」。
 *   playReveal() —— 落定的 A4 → E5 玻璃铃双击 + 微光，间隔 125ms。
 *  stopSound()  —— 浮层关闭时把还在响的尾巴收掉（铃尾比浮层活得久，不收会「声音找不到主人」）。
 *
 * ⚠️ 四个必须守住的 WebAudio 细节（踩过就知道多难查）：
 *  1. exponentialRampToValueAtTime 的目标值不能是 0，会直接抛错 —— 统一降到 0.0001。
 *  2. AudioContext 必须在用户手势里创建/恢复，否则 Chrome 会让它一直 suspended，
 *     表现是「代码没报错，但一点声音都没有」。调用点都在「点领取」触发的动画里，
 *     属于手势的后续，Safari 和 Chrome 都放行；另外每次播放前都 resume 一次兜底。
 *  3. 敲击音的音高要在 10ms 内从略高滑回基频（pitch drop）。少了这一下，
 *     正弦的起音是「平」的，听起来像按了一下蜂鸣器；有了它才有「被敲了一下」的弹性。
 *  4. stop() 对已经停止的节点会抛 InvalidStateError，收尾时每个节点都要单独 try。
 */

const STORE_KEY = 'zw:coupon-sound'

/** 静音偏好：读失败（隐私模式 / 无 localStorage）就当没静音，不影响功能 */
let muted = (() => {
  try {
    return window.localStorage.getItem(STORE_KEY) === 'off'
  } catch (e) {
    return false
  }
})()

export function isMuted() {
  return muted
}

export function setMuted(next) {
  muted = !!next
  try {
    window.localStorage.setItem(STORE_KEY, muted ? 'off' : 'on')
  } catch (e) {
    /* 存不下就只在本页生效 */
  }
}

let ctx = null
let master = null

/** 懒创建单例 AudioContext。失败（隐私模式 / 老浏览器）返回 null，调用方静默跳过 */
function audio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }
  if (ctx === false) return null
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) {
    ctx = false
    return null
  }
  try {
    ctx = new AC()
    // 主音量 0.5：这些音是「氛围」，用户不该被吓一跳
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  } catch (e) {
    ctx = false
    return null
  }
  return ctx
}

function noiseBuffer(c, seconds) {
  const len = Math.max(1, Math.floor(c.sampleRate * seconds))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1
  return buf
}

/** 翻卡前的一声「沙」：低通噪声下扫，像纸被掀起来 */
export function playCharge() {
  if (muted) return
  const c = audio()
  if (!c) return
  const t = c.currentTime

  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, 0.36)

  // 低通而不是带通：带通扫频时带宽会跟着中心频率一起变（420Hz 处 380Hz 宽、
  // 2400Hz 处 2180Hz 宽），听感是「从一个调突然变成一片噪声」，很怪。
  // 低通始终是「低频为主的全频噪声」，只是明暗在变，才像纸。
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(2600, t)
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.3)
  lp.Q.value = 0.6

  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.045)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)

  src.connect(lp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.36)
}

/* ===== 输出总线 =====
 * 每轮落定音走一条独立增益总线，关浮层时把这条总线上的节点一起收掉。
 * 铃尾 1.15s 比浮层的寿命长：用户点「开心收下」后浮层 0.5s 就没了，
 * 不收尾的话会出现「浮层已经关了，声音还在响」，像声音找不到主人。
 */
let bus = null
let busNodes = []

function openBus(c) {
  stopSound()
  const g = c.createGain()
  g.gain.value = 1
  g.connect(master)
  bus = g
  busNodes = []
  return g
}

/** 收掉这一轮还在响的声音。90ms 淡出而不是硬切 —— 直接 disconnect 会有「咔」的爆音 */
export function stopSound() {
  const c = ctx
  const g = bus
  const nodes = busNodes
  bus = null
  busNodes = []
  if (!g || !c) return
  try {
    const now = c.currentTime
    g.gain.cancelScheduledValues(now)
    g.gain.setValueAtTime(g.gain.value, now)
    g.gain.linearRampToValueAtTime(0.0001, now + 0.09)
    nodes.forEach((n) => {
      // 已经自然结束的节点再 stop 会抛 InvalidStateError，必须逐个兜住
      try {
        n.stop(now + 0.12)
      } catch (e) {
        /* 已经停过了 */
      }
    })
    window.setTimeout(() => {
      try {
        g.disconnect()
      } catch (e) {
        /* 上下文已被回收 */
      }
    }, 260)
  } catch (e) {
    /* 上下文已关闭（页面卸载时）—— 没有需要收的东西 */
  }
}

/**
 * 玻璃铃单音。freq 基频，at 起始时刻，amp 峰值，dur 衰减时长。
 *
 * 分音用**非谐和**比例 2.41 / 3.9 —— 这是玻璃/金属棒真实振动的模态比。
 * 换成 2 / 3 / 4 这种整数倍会变成风琴或方波的味道，失去「被敲的固体」的实感。
 */
function bell(c, dest, freq, at, amp, dur) {
  const mk = (ratio, a, d, detune) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * ratio, at)
    if (detune) osc.detune.value = detune
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(a, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, at + d)
    osc.connect(g).connect(dest)
    osc.start(at)
    osc.stop(at + d + 0.06)
    busNodes.push(osc)
  }

  mk(1, amp, dur, 0)
  // +9 音分的第二个基音：与主基音形成约 5 次/秒的拍频，玻璃「湿润」的来源。
  // v1 的错不在失谐本身，而在失谐量太小（±0.14% 只拍 1~2 次，听成音不准）。
  mk(1, amp * 0.35, dur * 0.92, 9)
  // 非谐和分音只给很短的头部：它们负责「敲击」的锐度，给长了会变刺
  mk(2.41, amp * 0.16, 0.26, 0)
  mk(3.9, amp * 0.07, 0.16, 0)
}

/**
 * 「微光」：16ms 的 3kHz 带通噪声，一记极短的锐度。
 *
 * 为什么必须有它：纯正弦无论怎么配分音比例，2~4kHz 都是空的（D 实测 ≥2.5kHz 能量 0.0%），
 * 所以听感是「好听但不够爽」——奖励感缺那一下。行业里金币/成功音的通行做法就是
 * 「低频给重量 + 极短高频给锐度」，锐度这一层只能是噪声瞬态。
 *
 * 三条约束，都不是随手写的：
 *  - 16ms：再长就听成「嘶」而不是「叮」；这是瞬态而不是音色。
 *  - 中心 3kHz + Q 1.4：落在人耳最敏感的 2~4kHz，但带宽足够宽，不会变成哨音。
 *  - 包络 pow(1-t, 3)：三次方衰减让能量集中在开头那 3~4ms，尾巴干脆利落。
 */
function sparkle(c, dest, at, amp) {
  const len = Math.max(1, Math.floor(c.sampleRate * 0.016))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)

  const src = c.createBufferSource()
  src.buffer = buf

  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 3000
  bp.Q.value = 1.4

  const g = c.createGain()
  g.gain.value = amp

  src.connect(bp).connect(g).connect(dest)
  src.start(at)
  busNodes.push(src)
}

/** 落定的双击：A4 → E5 纯五度上行，玻璃铃音 + 微光瞬态 */
export function playReveal() {
  if (muted) return
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const g = openBus(c)

  bell(c, g, 440.00, t, 0.26, 1.25)             // A4
  sparkle(c, g, t, 0.055)
  bell(c, g, 659.25, t + 0.125, 0.18, 1.0)      // E5，高音衰减快一点才自然
  sparkle(c, g, t + 0.125, 0.035)
}

/** 轻微震动：只有 Android Chrome 支持，iOS Safari 没有 vibrate，静默跳过即可 */
export function haptic() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([12, 34, 18])
    }
  } catch (e) {
    /* 用户关了权限就算了 */
  }
}
