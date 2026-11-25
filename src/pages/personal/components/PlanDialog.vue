<!-- 学习计划设置弹窗（从 myClassAll 的内联弹窗抽出，供多个页面复用）
     mode: add=创建计划 / edit=修改计划 / del=删除失效课程
     saved 事件在创建/修改成功后触发（父级刷新列表）；deleted 在删除成功后触发 -->
<template>
  <el-dialog
      :model-value="modelValue"
      :title="title"
      width="30%"
      @update:model-value="v => $emit('update:modelValue', v)"
  >
    <div class="dialogCont" v-if="mode != 'del'">
      <div class="fx dialogRow"><span>每周学习节数:</span>
        <el-input @input="planDayHandle" v-model="number" min="1" type="number"></el-input>
      </div>
      <div class="fx dialogRow"><span>预计学完时间:</span>
        <div class="lastTime">{{ lastTime }}</div>
      </div>
    </div>
    <p class="delTip" v-else>将从课表中移除这门已失效的课程（不影响订单和已学记录），确定删除吗？</p>
    <template #footer>
      <div class="planFooter">
        <button class="pfBtn pfGhost" @click="$emit('update:modelValue', false)">取消</button>
        <button class="pfBtn pfPrimary" :class="{ danger: mode == 'del' }" @click="confirm">
          {{ mode == 'del' ? '删除' : '确定' }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from '@/utils/date'
import { creatPlans, delMyClass } from '@/api/class.js'
import { errMsg } from '@/utils/request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'add' // add / edit / del
  },
  // 课表记录（LearningLessonVO：courseId / sections / weekFreq）
  lesson: {
    type: Object,
    default: null
  },
})
const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const title = computed(() => props.mode == 'edit' ? '修改计划' : props.mode == 'del' ? '删除课程' : '创建计划')
const currentData = ref(null)
const days = ref(0)
const number = ref(1)

// 打开时用传入的课表记录初始化（编辑模式带出已有周频）
watch(() => props.modelValue, (v) => {
  if (v) {
    currentData.value = props.lesson
    days.value = props.lesson ? Number(props.lesson.sections) || 0 : 0
    if (props.mode == 'edit') {
      number.value = Number(props.lesson && props.lesson.weekFreq) || 1
    } else {
      number.value = 1
    }
  }
})

const lastTime = computed(() => {
  // 每周学 n 节，m = 总节数/n 不足一周按一周算，从今天开始往后延 m*7 天
  const num = Math.ceil(days.value / number.value) * 7
  return number.value ? dayjs().add(num, 'day').format('YYYY-MM-DD') : ''
})

// 每周节数限制在 1~50
const planDayHandle = val => {
  val != '' && val < 1 ? number.value = 1 :
      val != '' && val > 50 ? number.value = 50 : null
}

const confirm = async () => {
  if (props.mode == 'del') {
    const res = await delMyClass(props.lesson.courseId).catch(() => null)
    if (res && res.code == 200) {
      ElMessage({ message: '已删除', type: 'success' })
      emit('update:modelValue', false)
      emit('deleted')
    } else {
      ElMessage({ message: errMsg(res, '删除失败'), type: 'error', grouping: true })
    }
    return
  }
  const req = {
    freq: number.value,
    courseId: currentData.value ? currentData.value.courseId : ''
  }
  const res = await creatPlans(req).catch(() => null)
  if (res && res.code == 200) {
    ElMessage({ message: `${title.value}成功`, type: 'success' })
    emit('update:modelValue', false)
    emit('saved')
  } else {
    // 用户主动操作失败必须给提示，否则表现为「点了没反应」
    ElMessage({ message: errMsg(res, '计划保存失败'), type: 'error', grouping: true })
  }
}
</script>
<style lang="scss" scoped>
.dialogRow{
  margin-bottom: 20px;
  span{
    width: 110px;
    line-height: 32px;
    color: var(--color-font2);
  }
}
.lastTime{
  line-height: 32px;
  color: var(--color-font1);
}
.delTip{
  font-size: 14px;
  line-height: 24px;
  color: var(--color-font2);
}
// 弹窗底部按钮：左右并排、右对齐（原 .bt 原子类是全宽堆叠的两条大横条，太笨重）。
// 用原生 button，不走 el-button——全局 .el-button{background:var(--color-main)!important} 会吃掉样式。
.planFooter{
  display: flex;
  justify-content: center;
  gap: 12px;
}
.pfBtn{
  min-width: 92px;
  height: 36px;
  padding: 0 22px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 34px;
  cursor: pointer;
  transition: background-color .15s, border-color .15s, color .15s;
}
.pfGhost{
  background: #fff;
  border: 1px solid var(--color-main-light2);
  color: var(--color-font1);
  &:hover{
    border-color: var(--color-main);
    color: var(--color-main);
    background: var(--color-main-light);
  }
  &:active{ background: var(--color-main-light2); }
}
.pfPrimary{
  background: var(--color-main);
  border: 1px solid var(--color-main);
  color: #fff;
  &:hover{ background: var(--color-hover); border-color: var(--color-hover); }
  &:active{ background: var(--color-active); }
  &.danger{
    background: var(--color-error);
    border-color: var(--color-error);
    &:hover{ background: var(--color-error1); border-color: var(--color-error1); }
    &:active{ background: var(--color-error2); }
  }
}
</style>
