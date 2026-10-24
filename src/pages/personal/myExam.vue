<!-- 我的考试 -->
<template>
  <div class="myExamWrapper">
    <div class="personalCards">
      <CardsTitle class="marg-bt-20" title="我的考试" />
      <!-- 加载中 -->
      <div v-if="status === 'loading'" class="nodata">
        <span class="tipText fadeInDelay">正在加载考试记录…</span>
      </div>
      <!-- 请求失败：把后端原文露出来 + 重试，不再静默 -->
      <div v-else-if="status === 'error'" class="nodata">
        <div class="errBox">
          <p class="errTitle">考试记录加载失败</p>
          <p class="errMsg">（{{ errorMsg }}）</p>
          <el-button type="primary" plain size="small" @click="getExamListData">重新加载</el-button>
        </div>
      </div>
      <template v-else>
        <div v-if="count == 0" class="nodata">
          <Empty ></Empty>
        </div>
        <ExamTable v-if="count > 0" :data="myExamData"></ExamTable>
        <div class="pageination" v-if="count > 0">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="count"
            class="mt-4"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { onMounted, ref, reactive } from "vue";
import { getExamList } from "@/api/class.js";
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'

// 组件导入
import CardsTitle from './components/CardsTitle.vue'
import ExamTable from './components/ExamTable.vue'
import Empty from "@/components/Empty.vue";

// mounted生命周期
onMounted(async () => {
  // 查询我的考试记录
  getExamListData()
});

/** 方法定义 **/

const myExamData = ref([])
const count = ref(0)
// loading / ok / error —— 必须显式区分三态。
// 原来是 `myExamData` 初值 null + 卡片根节点 `v-if="myExamData != null"`，
// 而请求失败时它永远是 null ⇒ 整张卡不渲染，页面一片空白且没有任何提示。
// 又因为网关对「服务不存在」返回的是 HTTP 200 + {code:0,msg:"服务不存在"}，
// axios 不会 reject，catch 也进不去 ⇒ 表现为「点了没反应」。
const status = ref('loading')
const errorMsg = ref('')
const params = reactive({
  pageNo: 1,
  pageSize: 10,
})
// 查询我的考试记录
const getExamListData = async () => {
  status.value = 'loading'
  try {
    const res = await getExamList(params)
    if (res.code == 200 && res.data != null) {
      myExamData.value = res.data.list || []
      count.value = Number(res.data.total) || 0
      status.value = 'ok'
    } else {
      // 业务失败（如考试服务没启动，网关回「服务不存在」）
      errorMsg.value = errMsg(res, '考试记录加载失败，请稍后重试')
      status.value = 'error'
    }
  } catch (err) {
    // 真正的网络层失败（超时 / 断网 / 5xx）
    const code = err?.response?.status
    errorMsg.value = code ? `网络异常（HTTP ${code}），请稍后重试` : '网络异常，请检查网络后重试'
    status.value = 'error'
  }
}

const handleSizeChange = (val) => {
  params.pageSize = val
  getExamListData()
}
const handleCurrentChange = (val) => {
  params.pageNo = val
  getExamListData()
}
</script>
<style lang="scss" src="./index.scss"> </style>
<!-- 加载中 / 加载失败 的样式已提到 index.scss 的 .nodata 里（订单、优惠券、考试、积分共用），
     这里不再重复一份，避免四个页面各写一套、改一个漏三个 -->
