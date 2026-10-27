import { onScopeDispose, ref, watch } from 'vue'

/**
 * 让「错误态」晚一点显示，好让骨架屏先站住。
 *
 * ── 为什么需要它（这是「闪」的真正来源）──────────────────────────────
 * 这几个 learning 接口在网关那一步就返回 `{"code":0,"msg":"服务不存在"}`，
 * HTTP 200、20~80ms 就回来了。而路由切换是同步的，所以页面必然经历这么一段：
 *
 *   第 0 帧   区块标题画出来了，数据区还是空的
 *   第 2 帧   请求失败，三张「加载失败」卡插进来
 *
 * 中间那 1~2 帧是个「标题 + 大片空白」的残版 —— 看着像页面渲染坏了。
 * 录屏（Page.startScreencast）实测这一帧活了约 40ms，就是用户说的「闪」。
 *
 * 之前试过「骨架延迟 180ms 显示」，方向反了：请求 40ms 就失败，骨架永远轮不到出现，
 * 反而把「空壳」那一帧暴露得更彻底。正确做法是反过来的 ——
 *
 *   loading 立即生效（第 0 帧就是完整骨架，看起来就是「正在加载」）
 *   error   晚 220ms 再生效（骨架至少站够 220ms，人眼会当成一次独立的加载事件）
 *   ok      立即生效（骨架本来就是照着内容画的，填满不算闪，不该为它牺牲速度）
 *
 * 为什么 ok 不等、error 要等：
 *   骨架 → 内容 是「同一版式的填充」，尺寸对得上，40ms 也不会觉得跳；
 *   骨架 → 错误卡 是「整块塌缩」（内容区 660px → 250px），落差太大，必须让它晚点发生。
 *
 * ── 用法 ────────────────────────────────────────────────────────
 *   const errReady = useErrorDelay(pointsStatus)
 *   <InlineError v-if="pointsStatus === 'error' && errReady" ... />
 *   <div v-else-if="pointsStatus !== 'ok'">骨架</div>
 *   <div v-else>内容</div>
 *
 * `v-else-if="status !== 'ok'"` 同时兜住 loading 和「已失败但还没到 220ms」，
 * 两种情况下画的都是骨架 —— 视觉上完全没有变化，错误卡是等骨架站够了才换上去的。
 *
 * @param {import('vue').Ref<string>} status 'loading' | 'ok' | 'error' 三态
 * @param {number} minLoading 骨架最少站多久（毫秒）
 * @returns {import('vue').Ref<boolean>} 是否允许把错误态显示出来
 */
export function useErrorDelay(status, minLoading = 220) {
  const ready = ref(false)
  // 本次 loading 是从什么时候开始的。0 表示「没有经历过 loading」——
  // 那种情况下不该延迟（否则一个本来就没有加载过程的错误会被压 220ms 才显示）。
  let since = 0
  let timer = null

  const clear = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(
    status,
    (s) => {
      // 状态一变就先掐掉上一个计时器：loading → error →（点重试）loading 时，
      // 上一次排的「到点显示错误卡」必须作废，否则重试的骨架刚出来就被错误卡盖掉。
      clear()

      if (s === 'loading') {
        since = Date.now()
        ready.value = false
        return
      }

      if (s === 'error') {
        const left = since ? minLoading - (Date.now() - since) : 0
        if (left <= 0) {
          ready.value = true
          return
        }
        timer = setTimeout(() => {
          timer = null
          ready.value = true
        }, left)
        return
      }

      // ok：内容立刻显示，不为骨架牺牲速度
      ready.value = false
    },
    { immediate: true }
  )

  // 组件在延迟窗口内被切走时，别让计时器在卸载后还去改一个已经废弃的 ref
  onScopeDispose(clear)

  return ready
}
