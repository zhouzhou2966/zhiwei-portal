<!-- 我的优化券 -->
<template>
  <div class="couponWrapper">
    <div class="personalCards">
      <div class="headTop fx-sb">
        <CardsTitle class="marg-bt-20" title="我的优惠券"/>
        <div class="fx">
          <span class="font-bt ft-14" @click="() => dialogVisible = true">兑换优惠券&gt;</span>
          <span @click="() => $router.push({path: '/personal/main/myCouponExplain'})"
                class="font-bt ft-14">优惠券使用说明&gt;</span>
        </div>
      </div>
      <div>
        <TableSwitchBar :data="tableBar" @changeTable="changeTable"></TableSwitchBar>
      </div>
      <!-- 请求失败：明确面板 + 重试。原来只弹一条 toast，列表停在空数组上，
           页面显示「暂无优惠券」，看起来像真的没有券 —— 其实是优惠券服务没起来。
           网关对「服务不存在」回的是 HTTP 200 + code:0，axios 不会 reject。 -->
      <div class="nodata" v-if="status === 'error'">
        <div class="errBox">
          <p class="errTitle">优惠券加载失败</p>
          <p class="errMsg">（{{ errorMsg }}）</p>
          <el-button type="primary" plain size="small" @click="getMyCouponData">重新加载</el-button>
        </div>
      </div>
      <div class="myCouponItems" v-else :class="{'is-empty': myCoupon.length === 0}">
        <CouponCards v-if="myCoupon.length > 0" :data="myCoupon" :type="actId"></CouponCards>
        <div v-else class="nodata">
          <!-- 首屏还没回来时不要立刻显示「空」，否则会闪一下 -->
          <span v-if="status === 'loading'" class="tipText fadeInDelay">正在加载优惠券…</span>
          <Empty v-else></Empty>
        </div>
      </div>
    </div>
    <el-dialog
        v-model="dialogVisible"
        title="兑换优惠券"
        width="30%"
    >
      <div class="exchangeCoupon fx"><span>优惠券码：</span>
        <el-input type="text" v-model="inputVal" placeholder="请输入"/>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="dialogVisible = false">取消</div>
          <div class="bt" type="primary" @click="exchangeCouponHandle">兑换</div>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>

/** 数据导入 **/
import {onMounted, ref} from "vue";
import {ElMessage} from "element-plus";
// errMsg 取业务失败文案（禁止写 res.data.msg）；catchMsg 取网络层失败文案
import {errMsg, catchMsg} from "@/utils/request";
import {getMyCoupon, exchangeCoupon, formatRule} from "@/api/class.js";
import {useRoute} from "vue-router";
import {dataCacheStore} from "@/store"

// 组件导入
import CardsTitle from "./components/CardsTitle.vue";
import TableSwitchBar from "./components/TableSwitch.vue";
import CouponCards from "@/components/CouponCards.vue";
import Empty from "@/components/Empty.vue";

const route = useRoute()
const store = dataCacheStore()

const tableBar = [
  {id: 1, name: '未使用'},
  {id: 2, name: '已使用'},
  {id: 3, name: '已过期'},
]

// tab切换
const actId = ref(1)
const changeTable = id => {
  actId.value = id
  getMyCouponData()
}

// mounted生命周期
onMounted(async () => {
  getMyCouponData()
});

/** 方法定义 **/
// 我的优惠券数据获取
const myCoupon = ref([])
/**
 * loading / ok / error —— 三态必须显式区分。
 * 原来请求失败时 myCoupon 还是空数组，页面渲染成「暂无优惠券」，
 * 把「服务没起来」伪装成了「你没有券」。
 */
const status = ref('loading')
const errorMsg = ref('')
const getMyCouponData = async () => {
  const params = {
    status: actId.value,
    pageNo: 1,
    pageSize: 1000
  }
  status.value = 'loading'
  try {
    const res = await getMyCoupon(params)
    if (res && res.code == 200 && res.data) {
      const list = res.data.list || []
      list.forEach(d => d.rule = formatRule(d))
      myCoupon.value = list
      status.value = 'ok'
      return
    }
    myCoupon.value = []
    errorMsg.value = errMsg(res, '优惠券加载失败，请稍后重试')
    status.value = 'error'
  } catch (err) {
    myCoupon.value = []
    errorMsg.value = catchMsg(err, '优惠券加载失败，请稍后重试') || '请先登录后查看优惠券'
    status.value = 'error'
  }
}

// 兑换优惠券
const dialogVisible = ref(false)
const inputVal = ref('')

const exchangeCouponHandle = async () => {
  if (inputVal.value == "") {
    ElMessage({message: '请输入正确的优惠券码'});
    return false
  }
  const params = {code: inputVal.value}
  // 兑换码兑换优惠券
  await exchangeCoupon(params)
      .then((res) => {
        if (res.code == 200) {
          ElMessage({
            message: '优惠券兑换成功',
            type: 'success'
          });
          dialogVisible.value = false
          getMyCouponData();
        } else {
          ElMessage({
            message: errMsg(res, '优惠券兑换失败'),
            type: 'error',
            grouping: true
          });
        }
      })
      .catch((err) => {
        // 原来这里写的是「订单列表请求失败！」—— 兑换接口的报错挂了个订单列表的文案
        ElMessage({
          message: catchMsg(err, '优惠券兑换失败，请稍后重试') || '优惠券兑换失败',
          type: 'error',
          grouping: true
        });
      });
}

</script>
<style lang="scss" src="./index.scss"></style>
