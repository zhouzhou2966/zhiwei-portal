<!-- 个人中心-我的订单 -->
<template>
  <div class="myOrderWrapper content">
    <CardsTitle class="marg-bt-20" title="我的订单" />
    <TableSwitchBar :data="tableBar" @changeTable="changeTable"></TableSwitchBar>
    <!-- 请求失败：给明确面板 + 重试，不要留一张空表格。
         网关对「服务不存在」回的是 HTTP 200 + {code:0,msg:"服务不存在"}，
         axios 不会 reject、catch 也进不去，原来只弹一条 toast，
         列表停在空数组上 ⇒ 页面显示「暂无相关订单」，看起来像真的没订单。 -->
    <div class="nodata" v-if="status === 'error'">
      <div class="errBox">
        <p class="errTitle">订单加载失败</p>
        <RetryButton @retry="getOrderListesData" />
      </div>
    </div>
    <!-- 加载中：这一块原来是 `<div class="table" v-else>`，也就是把 loading 也归到了
         「有数据」那一支 —— 请求还没回来，表头「课程信息 / 订单金额 / 实付金额 / 交易状态 / 操作」
         就已经画出来了。而订单服务没起来时网关是立即回 200 + code:0，几十毫秒就切成错误面板，
         表现就是这一行字闪一下。所以必须把 loading 单独拆出来，且占位文字延迟淡入（.fadeInDelay）。 -->
    <div class="nodata" v-else-if="status === 'loading'">
      <span class="tipText fadeInDelay">正在加载订单…</span>
    </div>
    <div class="table" v-else-if="status === 'ok'" :class="{ refreshing }">
      <div class="tabHead">
        <span class="fx-1 alignLeft">课程信息</span><span>订单金额</span><span>实付金额</span><span>交易状态</span><span>操作</span>
      </div>
      <div class="marg-bt-20" v-for="(item, index) in orderListData" :key="item.id">
        <div class="tabInfo">
          <div><span class="time alignLeft">{{item.createTime}}</span>订单号：{{item.id}}</div>
        </div>
        <div class="tabCont">
          <div class="orderList">
            <div class="fx-1 alignLeft" >
              <OrderCards :data="it" v-for="it in item.details" :key="it.courseId"></OrderCards>
            </div>
            <span>{{amountConversion(item.totalAmount)}}</span><span>{{amountConversion(item.realAmount)}}</span><span>{{orderStatus(item)}}</span>
            <span class="btCont">
              <span class="bt" v-if="isOrderPay(item)">评价课程</span>
              <span @click="() => $router.push({name: 'myOrderDetails',query: {id:item.id}})" class="bt bt-grey1">查看订单</span>
              <span v-if="item.status == 1 " @click="cancelOrderHandle(item)" class="bt bt-grey">取消订单</span>
              <!-- 去支付必须同时看 canPay：超时后到定时任务关单之间有个窗口，
                   status 还是 1，但支付接口已经会拒绝，只按 status 显示就会出现
                   「按钮能点、点进去说已超时」 -->
              <span v-if="item.status == 1 && item.canPay" @click="() => $router.push({path: '/pay/payment',query: {orderId:item.id}})" class="bt">去支付</span>
              <span v-if="item.status == 3 || item.status == 5"  @click="delOrderHandle(item)" class="bt bt-grey1">删除订单</span>
            </span>
          </div>
        </div>
      </div>
      <!-- 空状态：没有数据时只显示表头，看起来像功能坏了，这里补一句明确提示。
           必须等 loading 结束再判断，否则首次进入会先闪一下「暂无相关订单」。
           ⚠️ 还必须是「真的请求成功且列表为空」—— 失败时走上面的错误面板，
           不能在这里说「暂无订单」 -->
      <div class="emptyTip" v-if="status === 'ok' && !hasData">暂无相关订单</div>
    </div>
    <div class="pageination" v-show="count > 0">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="count"
        class="mt-4"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { onMounted, ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
// errMsg 取业务失败文案（禁止写 res.data.msg）；catchMsg 取网络层失败文案，
// 且能识别「401 已被拦截器处理」，避免再叠一条假报错
import { errMsg, catchMsg } from "@/utils/request";
import RetryButton from "@/components/RetryButton.vue";
import { getOrderListes, cancelOrder, delOrder } from "@/api/order.js";
import { useRoute } from "vue-router";
import { dataCacheStore } from "@/store"
import {amountConversion} from "@/utils/tool.js"
import { ElMessageBox } from 'element-plus'

// 组件导入
import CardsTitle from './components/CardsTitle.vue'
import TableSwitchBar from "./components/TableSwitch.vue";
import OrderCards from "./components/OrderCards.vue";


const route = useRoute()
const store = dataCacheStore()

const tableBar = [
  {id: 0, name: '全部'},
  {id: 1, name: '待支付'},
  {id: 2, name: '已支付'},
  {id: 3, name: '已关闭'},
  {id: 4, name: '已完成'},
  {id: 5, name: '已报名'},
  {id: 6, name: '已退款'}
]

// tab切换
const actId = ref(0)
const changeTable = id => {
  actId.value = id
  params.status = actId.value === 0 ? undefined : actId.value
  // ① 页码必须归位：原来切 tab 保留上一个 tab 的 pageNo，
  //    在第 2 页切到只有 1 条数据的 tab 时，查的是第 2 页 → 明明有数据却显示空。
  params.pageNo = 1
  // ② 先清掉上一个 tab 的列表，否则新 tab 的响应回来前会短暂显示别的 tab 的订单
  orderListData.value = []
  count.value = 0
  getOrderListesData()
}
// 分页
const count = ref(0)
const params = reactive({
  status: actId.value === 0 ? undefined : actId.value, // 订单状态：1：待支付，2：已支付，3：已关闭，4：已完成，5：已报名
  // refundStatus: 1, // 退款状态1：待审批，2：取消退款，3：同意退款，4：拒绝退款，5：退款成功，6：退款失败
  pageNo: 1,
  pageSize: 10,
})

const handleSizeChange = (val) => {
  params.pageSize = val
  getOrderListesData(true)
}

const handleCurrentChange = (val) => {
  params.pageNo = val
  getOrderListesData(true)
}

// mounted生命周期
onMounted(async () => {
  getOrderListesData()
});

/** 方法定义 **/
// 获取订单列表
const orderListData = ref([])
/**
 * loading / ok / error —— 三态必须显式区分。
 * 原来只有一个 `loading` 布尔值：请求失败时列表仍是空数组，页面照样渲染
 * 「暂无相关订单」，把「服务没起来」伪装成了「你没有订单」。
 */
const status = ref('loading')
const errorMsg = ref('')
// 翻页/改每页条数时静默刷新：保留旧列表 + 变淡，不闪「正在加载订单…」
const refreshing = ref(false)
const hasData = computed(() => Array.isArray(orderListData.value) && orderListData.value.length > 0)
/**
 * @param {boolean} silent 翻页时传 true：不把 status 打回 loading
 */
const getOrderListesData =  async (silent = false) => {
  if (silent) refreshing.value = true
  else status.value = 'loading'
  try {
    const res = await getOrderListes(params)
    if (res && res.code === 200 && res.data) {
      orderListData.value = res.data.list || []
      count.value = Number(res.data.total) || 0
      status.value = 'ok'
      return
    }
    // 业务失败：网关对「服务不存在」回的是 HTTP 200 + code:0，走的就是这条分支
    orderListData.value = []
    count.value = 0
    errorMsg.value = errMsg(res, '订单加载失败，请稍后重试')
    status.value = 'error'
  } catch (err) {
    // 网络层失败（超时 / 断网 / 5xx）。401 时 catchMsg 返回空串 ——
    // 拦截器已经弹过「重新登录」，这里再报一条就重复了
    orderListData.value = []
    count.value = 0
    errorMsg.value = catchMsg(err, '订单加载失败，请稍后重试') || '请先登录后查看订单'
    status.value = 'error'
  } finally {
    refreshing.value = false
  }
}
function isOrderPay(item){
  let status = item.status;
  return status === 2 || status === 4 || status === 5;
}
// 订单状态1：待支付，2：已支付，3：已关闭，4：已完成，5：已报名
function orderStatus(item) {
  // 待支付但已过支付时限：定时任务还没把状态改成「已关闭」，但后端已经拒绝支付了。
  // 这里直接显示「已超时」，否则会出现「状态写着待支付、却没有去支付按钮」的怪现象。
  if (item.status === 1 && item.canPay === false) {
    return '已超时'
  }
  let data = ''
  switch(item.status){
    case 1: {
      data = '待支付'
      break
    }
    case 2: {
      data = '已支付'
      break
    }
    case 3: {
      data = '已关闭'
      break
    }
    case 4: {
      data = '已完成'
      break
    }
    case 5: {
      data = '已报名'
      break
    }
    case 6: {
      // details 判空：这里对每条订单的明细做 findIndex，万一某条订单没有明细
      // （历史脏数据 / 明细被单独删除），原来会直接抛 TypeError 把整个列表渲染搞挂
      let i = (item.details || []).findIndex(d => d.refundStatus === 5);
      data = i !== -1 ? '已退款' : "退款中"
      break
    }
  }
  return data
}
// 取消订单
const cancelOrderHandle = async (item) => {
  ElMessageBox.confirm(
        `是否确认取消该订单吗？`,
        '取消订单',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'delete',
        }
      )
        .then(() => {
          cancelOrderAction(item)
        })
        .catch(() => {
        })
}
// 取消订单
const cancelOrderAction = async (item) => {
  await cancelOrder(item.id)
    .then((res) => {
      if (res.code === 200 ){
        item.status = 3
      } else {
        ElMessage({
        message: res.msg,
        type: 'error'
      });
      }
    })
    .catch(() => {
      ElMessage({
        message: "取消订单请求失败！",
        type: 'error'
      });
    });
}
// 删除确认
const delOrderHandle = async (item) => {
  ElMessageBox.confirm(
        `您确认删除该订单吗，点击确认将永久消失？`,
        '确认删除',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'delete',
        }
      )
        .then(() => {
          delOrderAction(item)
        })
        .catch(() => {
          ElMessage({
            message: "取消操作！",
            type: 'info'
          });
        })
}

// 删除订单
const delOrderAction = async (item) => {
  await delOrder(item.id)
    .then((res) => {
      if (res.code === 200 ){
        getOrderListesData()
        ElMessage({
          message: '订单删除成功',
          type: 'success'
        });
      } else {
        ElMessage({
          message: res.msg,
          type: 'error'
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "删除订单请求失败！",
        type: 'error'
      });
    });
}
</script>
<style lang="scss" src="./index.scss"> </style>
