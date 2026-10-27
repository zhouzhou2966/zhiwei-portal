import { onScopeDispose, ref, watch } from 'vue'

/**
 * 延迟显示骨架屏。
 *
 * 为什么需要它：骨架屏是「loading 就立刻画」的，而这几个 learning 接口
 * 在网关那一步就返回 `{"code":0,"msg":"服务不存在"}` —— HTTP 200、20~80ms 就回来了。
 * 于是骨架只活了 1~3 帧（实测 40ms），紧接着被三张「加载失败」卡替换：
 * 用户先看到一整屏灰条（整月日历格 + 两张 5 行表格），「啪」地缩成三个小方块 ——
 * 这就是「点进去会突兀地闪过一些东西」。
 *
 * 加了这个延迟之后：
 *   请求在 180ms 内结束（成功或失败都算）⇒ 骨架从头到尾没出现过，页面直接从空白
 *   变成内容 / 错误卡，中间没有任何东西可闪；
 *   请求真的慢 ⇒ 180ms 后骨架照常出现，该有的反馈一点没少。
 *
 * 阈值取 180ms：实测失败耗时 20~80ms，留了 2 倍余量；同时又压在 200ms 这条
 * 「人会察觉的延迟」线以下，慢网下用户也不会觉得「点了没反应」。
 * 这是业界通行做法（Material / GitHub / YouTube 的加载指示器都做延迟显示）。
 *
 * @param {() => boolean} isLoading 返回「当前是否 loading」的取值函数
 * @param {number} delay 延迟毫秒数
 * @returns {import('vue').Ref<boolean>} 是否应该把骨架画出来
 */
export function useSkeleton(isLoading, delay = 180) {
  const show = ref(false)
  let timer = null

  const clear = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(
    isLoading,
    (loading) => {
      // 每次状态变化都先把上一个计时器掐掉：
      // loading → error → （点重试）loading，如果不清，第一次的 timer 会在第二次
      // 期间把骨架点亮，出现「刚点重试骨架就冒出来」的假象。
      clear()
      if (!loading) {
        show.value = false
        return
      }
      timer = setTimeout(() => {
        timer = null
        show.value = true
      }, delay)
    },
    { immediate: true }
  )

  // 组件在 loading 期间被切走时，别让计时器在卸载后还去改一个已经废弃的 ref
  onScopeDispose(clear)

  return show
}
