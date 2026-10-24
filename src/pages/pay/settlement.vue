<!-- 支付 - 结算页面 -->
<template>
  <div class="settlementWrapper container bg-wt">
    <div class="title">购买课程</div>
    <!-- 结算信息没拿到之前，课程表格 / 金额 / 「去结算」都不该出现。
         原来这一页没有 loading / error 分支：订单服务没起来时 orderInfo 停在 {}，
         页面会渲染成「订单总价 ￥0.00、优惠金额 ￥0.00、实付金额 ￥NaN」外加一个能点的
         「去结算」，点下去在 orderInfo.courses.map 上直接抛 TypeError。
         加载占位用 .fadeInDelay 延迟淡入，服务秒挂时不会闪一下「正在加载」。 -->
    <div class="payStateTip fadeInDelay" v-if="status === 'loading'">正在加载结算信息…</div>
    <div class="payStateTip payStateTipError" v-else-if="status === 'error'">
      <p class="tit">结算信息加载失败</p>
      <p class="sub">{{ errorMsg }}</p>
      <el-button type="primary" plain size="small" @click="comfirePageInfoHandle">重新加载</el-button>
    </div>
    <template v-else>
      <div class="tab">
        <div class="tabHead fx-sb">
          <div>课程名称</div>
          <div class="cal">单价(元)</div>
        </div>
        <div class="tabItem fx-sb" v-for="item in orderInfo.courses" :key="item.id">
          <div class="fx">
            <img :src="item.coverUrl" alt="">
            <span>{{item.name || item.courseName}}</span>
          </div>
          <div class="cal ft-cl-err">￥ {{((item.nowPrice || item.price) / 100).toFixed(2)}}</div>
        </div>
      </div>
      <div class="settiementInfo">
        <div class="coupon fx">
          <div v-if="orderInfo.discounts && orderInfo.discounts.length > 0">
            优惠券： <el-select @change="changeHandle" v-model="couponIds" placeholder="请选择优惠券">
                      <el-option
                        v-for="item in orderInfo.discounts"
                        :key="item.ids"
                        :label="item.rule"
                        :value="item.ids"
                        :disabled="item.disabled"
                      />
                    </el-select>
          </div>
          <div v-else class="noData"> 优惠券： 暂无可用优惠券</div>
          <div class="price" style="width: 195px">
            <div class="fx-sb"><span>订单总价：</span> <span>￥ {{amountConversion(orderInfo.totalAmount)}}</span></div>
            <div class="fx-sb"><span>优惠金额：</span>  <span>￥ {{amountConversion(discountAmount) || 0}}</span></div>
          </div>
        </div>
        <div class="paid"><span>实付金额：</span><span class="ft-cl-err"> ￥ {{price}}</span></div>
        <div @click="orderHandle"><span class="bt bt-red">去结算</span></div>
      </div>
    </template>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
// catchMsg：网络层失败文案，能识别「401 已被拦截器处理」，避免再叠一条假报错
import { errMsg, catchMsg } from '@/utils/request'
/** 数据导入 **/
import { onMounted, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { confirmOrderInfo, setOrder} from "@/api/order.js";
import { dataCacheStore } from "@/store"
import {amountConversion} from "@/utils/tool.js"
const store = dataCacheStore()

const route = useRoute()
const router = useRouter()
onMounted(() => {
  comfirePageInfoHandle()
})
// 优惠金额
const discountAmount = ref(0)
// 选中的优惠券
const coupon = ref({})
// 实付金额
const price= computed(() => {
  // 三态改造后正常不会在没数据时渲染，这里再兜一层：totalAmount 缺失时不要吐 ￥NaN
  let p = ((Number(orderInfo.value.totalAmount) || 0) - discountAmount.value)/100
  p = p.toFixed(2)
  return p < 0 ? 0 : p;
})
// 优惠券Id
const couponIds = ref("")
// 订单信息
const orderInfo = ref({})
// 结算页三态：loading / ok / error
const status = ref('loading')
const errorMsg = ref('')
// 下单确认页信息
const comfirePageInfoHandle = async () => {
  status.value = 'loading'
  errorMsg.value = ''
  const courseIds = route.query.courseIds
  // 直接从收藏夹 / 刷新进来时 query 是空的，别发一个注定失败的请求
  if (!courseIds) {
    errorMsg.value = '缺少课程参数，请从课程详情页重新结算'
    status.value = 'error'
    return
  }
  const params = {courseIds}
  try {
    const res = await confirmOrderInfo(params)
    if (res && res.code === 200 && res.data) {
      if(res.data.discounts){
        res.data.discounts.forEach(d => {
          d.ids = d.ids.join();
          d.rule = d.rules.length > 1 ? `叠加${d.rules.length}券：【优惠${d.discountAmount/100}元】` : `单券：【${d.rules[0]}】`;
        })
      }
      orderInfo.value = res.data
      status.value = 'ok'
      return
    }
    // 业务失败：网关对「服务不存在」回的是 HTTP 200 + code:0，走的就是这条分支
    errorMsg.value = errMsg(res, '结算信息加载失败，请稍后重试')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '结算信息加载失败，请稍后重试') || '请先登录后再结算'
    status.value = 'error'
  }
}
const changeHandle = val => {
  const value = (orderInfo.value.discounts || []).filter(n => n.ids == val)
  discountAmount.value = value.length ? value[0].discountAmount : 0
}
// 下单
const orderHandle = async () => {
  // 兜一层：没拿到结算数据就点「去结算」，原来会在 courses.map 上抛 TypeError
  if (!Array.isArray(orderInfo.value.courses) || orderInfo.value.courses.length === 0) {
    ElMessage({ message: '结算信息不完整，请重新加载后再试', type: 'error' })
    return
  }
  const courseIds = orderInfo.value.courses.map(n => n.courseId ? n.courseId : n.id)
  const params = {courseIds, orderId: orderInfo.value.orderId}
  if (couponIds.value != null) {
    params.couponIds = couponIds.value.split(",");
  }
  try {
    const res = await setOrder(params)
    if (res && res.code === 200 && res.data) {
      router.push({path:'/pay/payment',query:{orderId: res.data.orderId}})
      return
    }
    ElMessage({ message: errMsg(res, '下单失败，请稍后重试'), type: 'error' })
  } catch (err) {
    // 原来这里 catch 里写的是「获取优惠券信息出错！」—— 下单失败挂了个优惠券的文案
    ElMessage({ message: catchMsg(err, '下单失败，请稍后重试') || '下单失败', type: 'error' })
  }
}
</script>
<style lang="scss" src="./index.scss"> </style>
