<!-- table切换头部 -->
<template>
  <!-- 打卡记录拉不到时，不要把整月都画成「未打卡」——那是在编数据。
       直接换成失败提示，日历网格等数据回来再画。 -->
  <div class="calendar" v-if="status === 'error'">
    <div class="calendarTop">
      <div class="titleBox">
        <span class="monthTitle">{{ monthTitle }}</span>
      </div>
    </div>
    <InlineError title="打卡记录加载失败" :msg="errorMsg" @retry="getSignRecordsHandel" />
  </div>
  <div class="calendar" v-else>
    <div class="calendarTop">
      <div class="titleBox">
        <span class="monthTitle">{{ monthTitle }}</span>
        <span class="signCount">本月已打卡 <b>{{ signedCount }}</b> 天</span>
      </div>
      <div class="label">
        <div class="fx marg-rt-20"><span></span> 未打卡 </div>
        <div class="fx"><span class="isRecords"></span>已打卡</div>
      </div>
    </div>
    <div class="calendarHead">
      <span v-for="item in week" :key="item">{{item}}</span>
    </div>
    <div class="calendarCont">
      <div class="day" v-for="item in calendarData" :key="item.date" :class="{ isOtherMonth: !isCurMonth(item.date) }">
        <template v-if="isCurMonth(item.date)">
          <div class="taday" v-if="item.date==currentDay">
            <span class="dayNum">{{item.date.split('-')[2]}}</span>
            <span class="dayTag" v-if="item.isRecords == 1">已打卡</span>
            <span class="dayTag" v-else @click="pointsSignHandle(item)">打卡</span>
          </div>
          <div :class="{records: item.isRecords == 1, noRecords: item.isRecords == 0}" v-else>
            {{item.date.split('-')[2]}}
          </div>
        </template>
        <!-- 前后月日期只做补位参考：浅灰、无底色、不参与打卡状态 -->
        <span v-else class="otherMonthDay">{{item.date.split('-')[2]}}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
// errMsg 取业务失败文案；catchMsg 取网络层失败文案
import { errMsg, catchMsg } from "@/utils/request";
import { getSignRecords } from "@/api/class.js";
import moment from 'moment';
import InlineError from "@/components/InlineError.vue";
// 接收父组件数据
const props = defineProps({
  data:{
    type: Array,
    default: []
  }
})
// 定义emits
const emit = defineEmits(['pointsSign']);
const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const calendarData = ref([])
const currentDay = moment().format('YYYY-MM-DD')
// 当前日历展示的年月（日历恒为当月）
const currentMonth = moment().format('YYYY-MM')
// 标题直接补全到今天（具体到哪一天）
const monthTitle = moment().format('YYYY年M月D日')
// 是否属于本月（不属于的只做补位参考）
const isCurMonth = (date) => date.slice(0, 7) === currentMonth
// 本月已打卡天数：直接从日历数据里数，打卡后 `pointsSignHandle` 把 isRecords 置 1，这里会自动跟着变
const signedCount = computed(() => calendarData.value.filter(it => isCurMonth(it.date) && it.isRecords == 1).length)

onMounted(() => {
  // 获取打卡数据
  getSignRecordsHandel()
})
// 日历数据处理
function getMounthDay(day){
  const arr = []
  // 计算本月一号 和最后一天 及一号是周几
  const startDay = moment().startOf('month').format("YYYY-MM-DD") // 本月第一天
  const startDayWeek = Number(moment(startDay).format('E')) // 第一天是周几
  const monthDay = moment().daysInMonth() // 
  // 计算当前月份日历的所有展示天总数
  const n = monthDay + (startDayWeek <= 6 ? startDayWeek+1 : 1);
  const calendarDay = n + (n % 7 == 0 ? 0 :7 - n % 7)
  for(let i = 0; i < calendarDay;i++){
    const date = moment(startDay).subtract(startDayWeek - i , 'd').format('YYYY-MM-DD')
    arr.push({
      date,
      week: week[7 - Number(moment(date).format('E'))],
      isRecords: signData.value[i-startDayWeek] // 0是未打卡 1 是已经打卡 99 是没到呢
    })
  }
  // 末尾补齐的下月日期照常展示（与左上角上月日期对称），只做浅灰弱化，不参与打卡状态
  calendarData.value = arr
}
// 打卡
const pointsSignHandle = (val) => {
  emit("pointsSign", val)
  val.isRecords = 1
}
// 获取打卡数据
const signData = ref([])
// loading / ok / error：失败时不能把整月都画成「未打卡」，那是在编数据
const status = ref('loading')
const errorMsg = ref('')
const getSignRecordsHandel = async () => {
  status.value = 'loading'
  try {
    const res = await getSignRecords()
    if (res && res.code == 200 && Array.isArray(res.data)) {
      signData.value = res.data
      // 日历数据处理
      getMounthDay(currentDay)
      status.value = 'ok'
      return
    }
    // 没有任何打卡记录时后端可能不返回 data，按「全是未打卡」处理是合理的；
    // 但 code != 200 说明服务有问题，不能当成空数据
    if (res && res.code == 200) {
      signData.value = []
      getMounthDay(currentDay)
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '打卡记录加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '打卡记录加载失败') || '请先登录后查看打卡记录'
    status.value = 'error'
  }
}
</script>
<style lang="scss" scoped>
.calendar{
  .calendarTop{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    .titleBox{
      display: flex;
      align-items: center;
      gap: 12px;
      .monthTitle{
        font-size: 16px;
        font-weight: 600;
        color: var(--color-font1);
      }
      .signCount{
        font-size: 12px;
        line-height: 22px;
        padding: 0 10px;
        border-radius: 11px;
        color: var(--color-main);
        background: var(--color-main-light);
        b{
          font-weight: 600;
        }
        em{
          font-style: normal;
          color: var(--color-font2);
        }
      }
    }
  }
  .label{
    line-height: 18px;
    font-size: 12px;
    color: var(--color-font2);
    display: flex;
    align-items: center;
    span{
      display: inline-block;
      width: 18px;
      height: 18px;
      background-color:#E8E8E8;
      margin-right: 10px;
      border-radius: 2px;
    }
    .isRecords{
      background: var(--color-main-light2);
    }
  }
  .calendarHead{
    display: flex;
    border-top: solid 1px #eeeeee;
    border-left: solid 1px #eeeeee;
    span{
      flex: 1;
      text-align: center;
      line-height: 40px;
      border-right: solid 1px #eeeeee;
      border-bottom: solid 1px #eeeeee;
    }
  }
  .calendarCont{
      display:flex;
      flex-wrap: wrap;
      border-left: solid 1px #eeeeee;
      .day{
          width: calc(100% / 7);
          text-align: center;
          line-height: 40px;
          min-height: 40px;
          border-right: solid 1px #eeeeee;
          border-bottom: solid 1px #eeeeee;
      }
      .isOtherMonth{
        background: #fbfbfb;
        .otherMonthDay{
          color: #c6c6c6;
          font-size: 13px;
        }
      }
      .taday{
        background-color: var(--color-main);
        color: #fff;
        cursor: pointer;
        // 今天这格既要显示日期数字，也要显示打卡状态，所以改成上下两行紧凑排
        height: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1;
        .dayNum{
          font-size: 15px;
          font-weight: 600;
        }
        .dayTag{
          margin-top: 3px;
          font-size: 11px;
          opacity: .88;
        }
      }
      .records{
        background: var(--color-main-light2);
        color: var(--color-main);
        font-weight: 600;
      }
      .noRecords{
        background: #E8E8E8;
      }
  }
}
</style>
