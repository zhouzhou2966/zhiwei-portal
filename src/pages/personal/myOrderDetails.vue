<!-- 个人中心-我的订单-详情 -->
<template>
  <div class="myOrderDetailsWrapper ">
    <!-- 请求失败：明确面板 + 重试。
         原来失败时 orderDetails 是 undefined，模板上一堆 `orderDetails && ...` 全部渲染成空，
         页面变成「订单号：空 / 订单总价：￥0 / 无优惠券」，看着像一条金额为 0 的真实订单。 -->
    <div class="content marg-bt-20" v-if="status === 'error'">
      <!-- 失败态也保留「← 订单详情」标题行，和成功态位置一致，不出现孤零零一个箭头 -->
      <div class="label withBack"><BackArrow /><span>订单详情</span></div>
      <div class="nodata">
        <div class="errBox">
          <p class="errTitle">订单详情加载失败</p>
          <p class="errMsg">（{{ errorMsg }}）</p>
          <el-button type="primary" plain size="small" @click="getOrderDetailsData">重新加载</el-button>
        </div>
      </div>
    </div>
    <!-- 成功态：标题行 + 订单进度 + 课程信息。
         注意必须是一个 v-else-if 包住这两块 —— 原来写成 v-if / v-else / v-else 三个兄弟节点，
         第二个 v-else 没有相邻 v-if，Vue 把前一个 v-else 整块丢弃，标题行和订单进度就从来没渲染过。 -->
    <div v-else-if="status === 'ok'">
      <div class="content marg-bt-20">
        <!-- 返回箭头贴在「订单详情」左边（.withBack 见 index.scss） -->
        <div class="label withBack"><BackArrow /><span>订单详情 </span>订单号 ：{{ orderDetails && orderDetails.id }}</div>
        <div class="orderTit">{{ orderDetails && orderDetails.message }}</div>
        <div class="linePint">
          <div class="nodePoint" v-for="item in orderDetails && orderDetails.progressNodes" :key="item.id">
            <div class="pintTit">{{ item.name }}</div>
            <div class="circular"></div>
            <div class="time">
              <p v-for="it in item.time.split(' ')" :key="it.name">{{ it }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="content">
        <CardsTitle class="marg-bt-20" title="课程信息"/>
        <div>
          <el-table class="table" :data="orderDetails && orderDetails.details">
            <el-table-column prop="courseName" center label="课程名称">
              <template #default="scope">
                <div>{{ scope.row.name }}</div>
              </template>
            </el-table-column>
            <el-table-column align="center" label="课程价格" width="180">
              <template #default="scope">
                <div>{{ amountConversion(scope.row.price) }}</div>
              </template>
            </el-table-column>
            <el-table-column align="center" label="实付金额" width="180">
              <template #default="scope">
                <div>{{ amountConversion(scope.row.realPayAmount) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120">
              <template #default="scope">
                <div v-if="scope.row.canRefund" class="font-bt1" @click="openRefundDialog('refund', scope.row)">申请退款</div>
                <span v-else-if="!scope.row.refundStatus || scope.row.refundStatus === 3"> -- </span>
                <div v-else class="font-bt1" @click="openRefundDialog('details', scope.row)">退款详情</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="info">
          <div><span>订单总价：</span>
            <span class="pirc">￥ {{ orderDetails && amountConversion(orderDetails.totalAmount) || 0 }}</span></div>
          <div class="fx">
            <span>优惠券：</span>
            <span v-if="orderDetails && orderDetails.couponRule.length" class="ruleBox">
              <span v-for="(r,i) in orderDetails.couponRule" :key="i">
              {{ r }}
              </span>
            </span>
            <span v-else class="pirc">无</span>
          </div>
          <div><span>优惠金额：</span><span
              class="pirc">￥ {{ orderDetails && amountConversion(orderDetails.discountAmount) || 0 }}</span></div>
          <div><span>实付金额：</span><span
              class="pirc red">￥ {{ orderDetails && amountConversion(orderDetails.realAmount) || 0 }}</span></div>
        </div>
      </div>
    </div>
    <!-- 加载中：之前 loading 期间直接渲染空的「课程信息」表格，会闪一下空表 -->
    <div class="content" v-else>
      <div class="nodata"><span class="tipText fadeInDelay">正在加载订单详情…</span></div>
    </div>
    <!-- 申请退款 - start -->
    <el-dialog
        v-model="refundDialog"
        title="申请退款"
        width="40%"
    >
      <div class="refundCont">
        <div class="fx"><span class="lab">退款原因：</span>
          <el-select v-model="refundReason" class="m-2" style="width:100%;" placeholder="请选择退款原因">
            <el-option
                v-for="item in refundsOptions"
                :key="item"
                :label="item"
                :value="item"
            />
          </el-select>
        </div>
        <div class="fx">
          <span class="lab">问题描述：</span>
          <el-input
              v-model="questionDesc"
              rows="4"
              maxlength="200"
              placeholder="请输入退款详细描述"
              show-word-limit
              type="textarea"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="refundDialog = false">取消</div>
          <div class="bt" type="primary" @click="refundApplyReq">提交</div>
        </span>
      </template>
    </el-dialog>
    <!-- 申请退款 - end -->
    <!-- 退款详情 - start -->
    <el-dialog
        v-model="refundDetailsDialog"
        title="退款详情"
        width="60%"
    >
      <div class="refundDetailsCont">
        <div class="tab">
          <div class="ut"><p class="ft-wt-600">退款ID</p>
            <p class="ft-cl-des">{{ refundDetailsData.id }}</p></div>
          <div class="ut"><p class="ft-wt-600">支付方式</p>
            <p class="ft-cl-des">{{ refundDetailsData.payChannel || "--" }}</p></div>
          <div class="ut"><p class="ft-wt-600">退款流水号</p>
            <p class="ft-cl-des">{{ refundDetailsData.refundOrderNo }}</p></div>
          <div class="ut"><p class="ft-wt-600">退款方式</p>
            <p class="ft-cl-des">{{ refundDetailsData.refundChannel }}</p></div>
          <div class="ut"><p class="ft-wt-600">订单ID</p>
            <p class="ft-cl-des">{{ refundDetailsData.orderId }}</p></div>
          <div class="ut"><p class="ft-wt-600">申请原因</p>
            <p class="ft-cl-des">{{ refundDetailsData.refundReason }}</p></div>
          <div class="row">
            <div class="ft-wt-600">操作时间</div>
            <div class="ft-cl-des fx-wp">
              <span>下单时间：{{ refundDetailsData.orderTime }}</span><span>支付时间{{ refundDetailsData.paySuccessTime }}</span>
              <span>退款申请时间：{{ refundDetailsData.createTime }}</span><span>退款审批时间：{{ refundDetailsData.approveTime }}</span>
            </div>
          </div>
          <div class="row">
            <p class="ft-wt-600">处理结果：</p>
            <p class="ft-cl-des" v-if="refundDetailsData.remark != null">
              审批结果：{{ refundDetailsData.remark ? '同意' : '拒绝退款' }}</p>
            <p class="ft-cl-des">审批意见：{{ refundDetailsData.approvalOpinion || '暂无！' }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
    <!-- 退款详情 - end -->
  </div>
</template>
<script setup>

/** 数据导入 **/
import {onMounted, ref} from "vue";
import {ElMessage} from "element-plus";
// errMsg 取业务失败文案（禁止写 res.data.msg）；catchMsg 取网络层失败文案
import {errMsg, catchMsg} from "@/utils/request";
import {getOrderDetails, refundsApply, refundsDetails} from "@/api/order.js";
import {useRoute} from "vue-router";
import {dataCacheStore} from "@/store"
import {amountConversion} from "@/utils/tool.js"
import {ElMessageBox} from 'element-plus'

// 组件导入
import BackArrow from "./components/BackArrow.vue";
import CardsTitle from './components/CardsTitle.vue'
import router from "../../router";

const route = useRoute()
const store = dataCacheStore()
const refundOrderDetail = ref({});
// 打开退款详情弹窗
const refundDialog = ref(false)
const openRefundDialog = (val, detail) => {
  refundOrderDetail.value = detail || '';
  val === 'details' ? refundDetailsReq() : refundDialog.value = true
}

// mounted生命周期
onMounted(async () => {
  getOrderDetailsData()
});

// 申请退款
const refundsOptions = ['由于技术故障引发课程无法学习', '未使用优惠券', '个人原因（个人网络原因，计划有变，账号异常等）', '课程内容不感兴趣', '其他']
const questionDesc = ref('')
const refundReason = ref('')

const refundDetailsDialog = ref(false)
const refundApplyReq = () => {
  if (refundReason.value === '') {
    ElMessage({
      message: '请选择退款原因',
      type: "error",
    });
    return false
  }
  if (questionDesc.value === "") {
    ElMessage({
      message: '请输入退款问题描述',
      type: "error",
    });
    return false
  }
  const params = {
    orderDetailId: refundOrderDetail.value.id,
    questionDesc: questionDesc.value,
    refundReason: refundReason.value
  }
  // 上面验证通过后申请退款
  refundsApply(params)
      .then((res) => {
        if (res.code === 200) {
          refundDialog.value = false;
          ElMessage({
            message: "退款成功",
            type: 'success'
          });
          router.push('/account/main/myOrder')
        } else {
          ElMessage({
            message: errMsg(res, '申请退款失败'),
            type: 'error',
            grouping: true
          });
        }
      })
      .catch((err) => {
        // 原来这里写的是「订单列表请求失败！」—— 申请退款挂了个订单列表的文案
        ElMessage({
          message: catchMsg(err, '申请退款失败，请稍后重试') || '申请退款失败',
          type: 'error',
          grouping: true
        });
      });
}
// 退款详情
const refundDetailsData = ref()
const refundDetailsReq = () => {
  refundsDetails(refundOrderDetail.value.id)
      .then((res) => {
        if (res.code === 200) {
          refundDetailsData.value = res.data
          refundDetailsDialog.value = true
        } else {
          ElMessage({
            message: errMsg(res, '退款详情加载失败'),
            type: 'error',
            grouping: true
          });
        }
      })
      .catch((err) => {
        ElMessage({
          message: catchMsg(err, '退款详情加载失败，请稍后重试') || '退款详情加载失败',
          type: 'error',
          grouping: true
        });
      });
}

// 获取订单详情信息
const orderDetails = ref()
// loading / ok / error：失败时必须和「加载成功但字段为空」区分开
const status = ref('loading')
const errorMsg = ref('')
const getOrderDetailsData = async () => {
  status.value = 'loading'
  try {
    const res = await getOrderDetails(route.query.id)
    if (res && res.code === 200 && res.data) {
      res.data.couponRule = res.data.couponDesc ? res.data.couponDesc.split("/") : [];
      orderDetails.value = res.data
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '订单详情加载失败，请稍后重试')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '订单详情加载失败，请稍后重试') || '请先登录后查看订单'
    status.value = 'error'
  }
}

// 
</script>
<style lang="scss" src="./index.scss"></style>
<style>
.ruleBox {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.ruleBox span {
  width: 200px;
  overflow: hidden;
  line-height: 20px;
  height: 20px;
  text-align: right;
}
.myOrderDetailsWrapper .info .pirc {
  width: 200px;
}
</style>
