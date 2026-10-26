<!-- 购物车 -->
<template>
  <div class="cartsWrapper">
    <!-- 我的购物车-列表 - start -->
    <div class="container bg-wt marg-bt-20">
      <!-- 数量只在加载成功后显示：服务挂了却写「共0门课程」，等于告诉用户「你的课没了」 -->
      <div class="title">我的购物车 <span v-if="status === 'ok'">共{{carts.length}}门课程</span></div>
      <!-- 加载失败要常驻面板 + 重试：原来只弹一条 3 秒 toast，carts 保持空数组，
           页面直接渲染成「共0门课程 + 继续逛逛」的空车样式，用户会以为车里的课被清空了 -->
      <InlineError v-if="status === 'error'" title="购物车加载失败" :msg="errorMsg" @retry="getCartsData" />
      <div class="tab" v-else-if="status === 'ok' && carts.length > 0" >
        <div class="tabHead fx-sb">
          <div>课程名称</div>
          <div class="fx">
            <div class="cal">单价(元)</div>
            <div class="cal">操作</div>
          </div>
        </div>
        <el-checkbox-group
          v-model="checkedList"
          @change="handleCheckedChange"
        >
        <div class="tabItem fx-sb" v-for="item in carts" :key="item.id">
          <div class="checkBox fx">
            <el-checkbox :label="item.id" :disabled="item.expired">
            <img :src="item.coverUrl" alt="">
            </el-checkbox>
            <span class="name" @click="goDetails(item.courseId)" style="cursor: pointer;">
              {{item.courseName}}{{item.expired ? "(已失效)" : ""}}
            </span>
          </div>
          <div class="fx" style="align-items: center;">
            <div class="cart-price" >
              <div class="cal ft-cl-err" >￥ {{(item.nowPrice / 100).toFixed(2)}}</div>
              <div class="cal ft-cl-err cart-price-div" v-if="item.nowPrice < item.price">
                比加入时便宜了 ￥ {{((item.price - item.nowPrice) / 100).toFixed(2)}}
              </div>
            </div>
            <div class="cal font-bt2" @click="delHandle(item)">删除</div>
          </div>
        </div>
        </el-checkbox-group>
      </div>
      <!-- 购物车数据为空（只在确实加载成功、且真的没数据时出现） -->
      <div class="empty" v-else-if="status === 'ok'">
        <div><img src="@/assets/img_gouwuche.png" width="200" alt=""></div>
        <div class="desc">看到喜欢的课程，点击【加入购物车】，在这里合并购买</div>
        <div class="bt" @click="() => $router.push('/search/index')">继续逛逛</div>
      </div>
      <div class="empty" v-else>
        <div class="desc fadeInDelay">正在加载购物车…</div>
      </div>
    </div>
    <!-- 我的购物车-列表 - end -->
    <!-- 我的购物车-结算 - start -->
    <div class="container bg-wt fx-sb" v-if="carts.length > 0">
      <div class="allAction fx">
        <div class="marg-rt-20">
          <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
          >全选</el-checkbox>
        </div>
        <div class="bt bt-grey1" @click="delHandle('all')">删除</div>
      </div>
      <div class="count ft-14 fx fx-1">
        <div>
          <p>合计： <span class="pric">￥ {{ (totalAmount / 100).toFixed(2)}}</span></p>
          <p>若购买享有优惠，相应金额将在订单结算页面减扣</p>
        </div>
        <div @click="goSettlement" class="bt bt-red">去下单</div>
      </div>
    </div>
    <!-- 我的购物车-结算 - end -->
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
// catchMsg：网络层失败（服务没起 / 超时）的文案
import { errMsg, catchMsg } from '@/utils/request'
/** 数据导入 **/
import { onMounted, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { getCarts, delCarts } from "@/api/order.js";
import router from "../../router";
// moment 曾在此 import 但全文未使用，迁移到 dayjs 时一并清掉
import { amountConversion } from "@/utils/tool.js"
import InlineError from "@/components/InlineError.vue"

import { dataCacheStore } from "@/store"
const store = dataCacheStore()
let totalAmount = ref(0);
onMounted(() => {
  // 获取章节列表 - 下拉选择
  getCartsData()
})

const carts = ref([])
// 三态：loading / ok / error（失败要能区分「真的没课」和「没加载出来」）
const status = ref('loading')
const errorMsg = ref('')

const goDetails = (id) => {
  router.push({path: '/details', query:{id}})
}
// 获取购物车信息
const getCartsData = async () => {
  status.value = 'loading'
  try {
    const res = await getCarts()
    if (res && res.code === 200) {
      carts.value = Array.isArray(res.data) ? res.data : []
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '购物车加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '购物车加载失败')
    status.value = 'error'
  }
}

const checkAll = ref(false) // 是否全选
const checkedList = ref([]) // 选项
const isIndeterminate = ref(false) // 是否有选项 
const calcTotalAmount = () =>{
  totalAmount.value = carts.value.filter(c => checkedList.value.findIndex(v=>v===c.id) > -1).map(c => c.nowPrice).reduce((l, p) => l + p, 0);
}
// 全选
const handleCheckAllChange = (val) => {
  checkedList.value = val ? carts.value.map(n => n.id) : []
  isIndeterminate.value = false
  calcTotalAmount();
}
// 单个选择
const handleCheckedChange = (value) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === carts.value.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < carts.value.length
  calcTotalAmount();
}
// 删除
const delHandle = (item) => {
  const params = item != 'all' ? [item.id] : checkedList.value
  if (params == '' || params.length <= 0){
    ElMessage({
          message:`请选择操作课程`,
          type: 'error'
        });
    return 
  }
  delCarts(params)
    .then((res) => {
      if (res.code === 200) {
        ElMessage({
          message:`课程删除成功`,
          type: 'success'
        });
        getCartsData()
      } else {
        ElMessage({
          message:errMsg(res),
          type: 'error'
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "删除请求出错！",
        type: 'error'
      });
    });
}
// 去结算
const goSettlement = () => {
  if(checkedList.value.length === 0){
    ElMessage({
          message:'请选择要结算的课程',
          type: 'error'
        });
    return false
  } 
  const list = carts.value.filter(n =>checkedList.value.indexOf(n.id) !== -1)
  // store.setOrderClassInfo(list)
  router.push({path: '/pay/settlement', query: {courseIds: list.map(c => c.courseId).join()}})
}
</script>
<style lang="scss" src="./index.scss">
</style>
