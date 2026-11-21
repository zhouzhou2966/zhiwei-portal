<!-- 侧栏签到按钮（规格见改造方案 §6.6）
     只读 useClassOverview 的单例状态，不自己发读请求；
     只有点击才写（POST /ls/sign-records），成功后刷新「打卡 + 今日积分」这一对。 -->
<template>
  <button class="sideSign" type="button" :class="{ done: todaySigned, dis: signing }" @click="sign">
    {{ buttonText }}
  </button>
</template>
<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { dayjs } from '@/utils/date'
import { pointsSign } from '@/api/class.js'
import { errMsg } from '@/utils/request'
import { loadSignAndPoints, useClassOverview } from './useClassOverview'

const overview = useClassOverview()
const signing = ref(false)

/** 今天是否已签到：sign-records 是「本月每天 0/1」的数组，索引 0 = 1 号 */
const todaySigned = computed(() => {
  if (!overview.signReady) return false
  const idx = dayjs().date() - 1
  return overview.signData[idx] === 1
})

// 文案不写死「+N 积分」：签到得分由后端规则决定，前端不参与计算
const buttonText = computed(() => {
  if (todaySigned.value) return '今日已签到'
  if (signing.value) return '签到中…'
  return '签到'
})

const sign = async () => {
  if (todaySigned.value || signing.value) return
  signing.value = true
  try {
    const res = await pointsSign()
    if (res && res.code == 200) {
      ElMessage({ message: '签到成功', type: 'success' })
      // 签到了却还显示「今日 0 分 / 未打卡」会自相矛盾，必须重拉这一对
      await loadSignAndPoints()
      return
    }
    ElMessage({ message: errMsg(res, '签到失败'), type: 'error' })
  } catch (err) {
    ElMessage({ message: '签到失败，请稍后重试', type: 'error' })
  } finally {
    signing.value = false
  }
}
</script>
<style lang="scss" scoped>
.sideSign {
  flex: none;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: var(--main);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color .16s;
  &:hover {
    background: var(--main-deep);
  }
  &.done {
    background: var(--accent-soft);
    color: var(--accent);
    cursor: default;
  }
  &.dis {
    opacity: .7;
    cursor: default;
  }
}
</style>
