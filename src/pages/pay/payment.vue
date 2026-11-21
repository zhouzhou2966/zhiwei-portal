<!-- 支付 - 支付页面 -->
<template>
  <div class="paymenttWrapper container bg-wt">
    <div class="title">支付订单</div>

    <!-- 加载中：数据还没回来时不要先摆出「订单提交成功」和 00分00秒 —— 那两句都是编的 -->
    <div v-if="payStatus === 'loading'" class="payStateTip fadeInDelay">正在获取支付信息…</div>

    <!-- 加载失败：支付服务挂掉时，原来页面照样显示「订单提交成功」+ 一片空白的支付方式区，
         用户既看不出问题也付不了款，只能干瞪眼刷新 -->
    <div v-else-if="payStatus === 'error'" class="payStateTip payStateTipError">
      <p class="tit">支付信息加载失败</p>
      <p class="sub">{{ payErrorMsg }}</p>
      <el-button type="primary" @click="retryPay">重新加载</el-button>
    </div>

    <template v-else>
      <div class="successCont fx-sb">
        <div class="fx">
          <img src="@/assets/icon_success.png" width="72" height="72" alt="">
          <div class="">
            <p class="tit">订单提交成功！请尽快完成支付。</p>
            <p class="fx">支付还剩 <span class="ft-cl-err"><Countdown @timeOver="timeOver" :endTime="orderInfo && orderInfo.payOutTime"></Countdown></span> , 超时后将取消订单</p>
          </div>
        </div>
        <div class="price">
          <span>应付金额：</span>
          <span class="ft-cl-err">¥ {{orderInfo &&  amountConversion(orderInfo.payAmount)}}</span>
        </div>
      </div>
      <div class="pay">
        <div class="tit">选择一下支付方式付款</div>
        <div class="fx">

          <div v-for="item in payMethodList" :key="item.id" @click="payMethodCheck(item)" class="cont marg-rt-20" :class="{act: payMethod.id === item.id}">
            <img :src="item.channelIcon" width="44" height="44" alt=""> {{ item.name }}
          </div>
        </div>
      </div>
    </template>
    <!-- 支付二维码弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      width="440px"
      :before-close="handleClose"
    >
      <template #header class="dialog-title">
        <span>{{payMethod.name}}支付</span>
      </template>
      <div style="padding: 0 40px" v-if="qrCodeUrl != ''">
        <qrcode-vue :key="qrCodeUrl" :value="qrCodeUrl" :size="320" level="H" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <p>请使用<em> {{payMethod.name}} </em>扫一扫</p> <p>二维码完成支付</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
/** 数据导入 **/
import { onMounted,reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { getPayMethod, getPayUrl, getPayState } from "@/api/order.js";
import {amountConversion} from "@/utils/tool.js"
import QrcodeVue from 'qrcode.vue'
import Countdown from './components/Countdown.vue'

const route = useRoute()
const router = useRouter()

/**
 * 支付页三态：loading / ok / error。
 * 原来只有「成功」一条路 —— getPayState / getPayMethod 失败时只弹一条 toast，
 * 页面继续显示「订单提交成功！请尽快完成支付。」和一片空白的支付方式区，
 * 用户看到的是一个「看着一切正常、但就是付不了款」的页面。
 */
const payStatus = ref('loading')
const payErrorMsg = ref('')
// 轮询连续失败次数：已经正常显示过之后再抖动，先静默重试；
// 连续 3 次（≈15 秒）都失败才认定服务真挂了。
const MAX_PAY_STATE_FAIL = 3
let payStateFailCount = 0

onMounted(() => {
  // 获取支付渠道列表
  getPayMethodList()
  // 获取订单的信息及时效
  getPayStateData()
})
// 支付二维码弹窗数据
const dialogVisible = ref(false)
const dialogCont = reactive({
  title: '',
  desc: ''
})

const title = ref('')
// 选择支付方式
const payMethod = ref({})
const payMethodCheck = (item) => {
  payMethod.value = item
  // 获取二维码 
  getPayUrlData(item)
} 

// 选择小节的数据
const value = ref([])

// 提问数据
const ruleForm = reactive({
  courseId: '', // 课程id,
  chapterId: '',  // 章Id
  sectionId: '', // 小节Id
  title: '', 
  anonymity: false, // 是否匿名
  description: '',
})

// 获取支付渠道列表
const payMethodList = ref([]) // 支付渠道信息
const getPayMethodList = async () => {
  let res
  try {
    res = await getPayMethod()
  } catch (e) {
    // 网络层失败（超时/断网）没有业务体，只能给兜底文案
    stopPollingAndFail('网络异常，请检查网络后重试')
    return
  }
  // 渠道列表为空等于没法付款，和请求失败一样处理
  if (res.code == 200 && Array.isArray(res.data) && res.data.length > 0) {
    payMethodList.value = res.data
    return
  }
  stopPollingAndFail(res.code == 200 ? '暂无可用的支付方式，请稍后重试' : errMsg(res, '支付方式加载失败'))
} 

// 轮询失败 / 渠道加载失败时的统一收尾。
// ⚠️ 必须先停表：getPayStateData 是 setInterval 每 5 秒调一次的，
// 失败分支如果只 ElMessage，支付服务一挂，用户会被同一句「服务不存在」按 5 秒一条刷屏。
const stopPollingAndFail = (msg) => {
  clearInterval(timer.value)
  timer.value = null
  // 二维码一起收掉：轮询停了就没人再查支付状态，留着二维码等于让用户白扫一遍
  dialogVisible.value = false
  payErrorMsg.value = msg
  payStatus.value = 'error'
}

// 单次轮询失败的处置：区分「首次就没加载出来」和「正常显示过之后抖了一下」
const onPayStateFail = (msg) => {
  // 从来没成功过 = 首次加载就失败，直接进错误态，别让用户对着空白页干等 15 秒
  if (payStatus.value !== 'ok') {
    stopPollingAndFail(msg)
    return
  }
  // 已经正常显示过：可能只是抖了一下，先静默重试；连续 3 次都失败才认输
  payStateFailCount += 1
  if (payStateFailCount >= MAX_PAY_STATE_FAIL) {
    stopPollingAndFail(msg)
  }
}

// 获取支付二维码链接
const timer = ref(null) // 定时获取支付状态
const qrCodeUrl = ref('') 
const getPayUrlData = async val => {
  const payChannelCode = val.channelCode
  const params = {orderId: route.query.orderId, payChannelCode}
  let res
  try {
    res = await getPayUrl(params)
  } catch (e) {
    ElMessage({ message: '获取支付二维码失败，请检查网络后重试', type: 'error', grouping: true })
    return
  }
  if (res.code == 200 && res.data) {
    qrCodeUrl.value = res.data
    dialogVisible.value = true
    // 先清掉上一轮的定时器：用户可以来回点不同渠道，
    // 不 clear 的话每点一次就多一个 setInterval，轮询频率翻倍
    clearInterval(timer.value)
    timer.value = setInterval(() => {
      getPayStateData()
    }, 5000)
    return
  }
  ElMessage({ message: errMsg(res, '获取支付二维码失败'), type: 'error', grouping: true })
} 
// 获取支付信息,包含支付状态和支付超时时间 payStaus 1:待支付，2：已支付，3：已关闭，4：已完成，5：已报名，6：已退款
const orderInfo = ref()
const getPayStateData = async () => {
  // 已经进错误态就不再打请求：轮询早停了，剩下的是「重新加载」按钮的事
  if (payStatus.value === 'error') return
  let res
  try {
    res = await getPayState({orderId: route.query.orderId})
  } catch (e) {
    // 原来这里是空的 catch，超时/断网完全静默，用户只看到页面不动
    onPayStateFail('网络异常，请检查网络后重试')
    return
  }
  // code=200 但 data 为空（订单不存在）也算失败，别当成正常订单往下渲染
  if (res.code !== 200 || !res.data) {
    onPayStateFail(errMsg(res, '支付信息加载失败'))
    return
  }
  const data = res.data
  payStateFailCount = 0
  // 不管什么状态都先落到 orderInfo：倒计时组件要拿 payOutTime 来算。
  // 原来只在 status=1 时才赋值，其余状态下 orderInfo 是 undefined，
  // Countdown 拿到 endTime=undefined，parseDate(undefined) 等于当前时刻，
  // diff<=0 立刻触发 timeOver —— 表现就是支付页闪一下就被跳走。
  orderInfo.value = data
  if (payStatus.value !== 'error') payStatus.value = 'ok'
  if (data.status === 2 || data.status === 5) {
    // 已支付 / 已报名
    clearInterval(timer.value)
    router.push({path:'/pay/success', query:{order: data.id}})
  } else if (data.status !== 1) {
    // 已关闭(3) / 已完成(4) / 申请退款(6) 都不该再停在这个页面。
    // 原来这里是空的 else —— 订单被后台关掉后页面毫无反应，二维码还挂在屏幕上，
    // 但渠道支付单已经被 pay 关掉了，用户扫了也付不了，只会更困惑。
    clearInterval(timer.value)
    dialogVisible.value = false
    ElMessage.warning(
      data.status === 3 ? '订单已超时关闭，请重新下单' : '订单状态已变更，请返回订单列表查看'
    )
    router.push('/account/main/myOrder')
  }
} 
// 错误面板上的「重新加载」：两个请求都重发一遍（渠道列表和订单状态任一失败都会落到错误态）
const retryPay = async () => {
  payStatus.value = 'loading'
  payErrorMsg.value = ''
  payStateFailCount = 0
  await Promise.all([getPayMethodList(), getPayStateData()])
}
const handleClose = (done) => {
  clearInterval(timer.value)
  done()
}
// 倒计时归零 = 已过支付时限，后端从这一刻起就会拒绝支付。
// 定时任务可能还没把订单关掉（最多差一分钟），所以这里不查状态、直接按超时处理，
// 免得用户停在页面上继续点支付、再被 400 顶回来。
const timeOver = () => {
  clearInterval(timer.value)
  dialogVisible.value = false
  ElMessage.warning('订单已超时，已为你取消')
  router.push('/account/main/myOrder')
}
</script>
<style lang="scss" src="./index.scss"> </style>
