<!-- 我的积分 -->
<template>
  <div class="myInterralWrapper">
    <div class="personalCards">
      <CardsTitle class="marg-bt-20" title="我的积分" />
      <div class="title"></div>
      <!-- 打卡日历 -->
      <Calendar @pointsSign="pointsSignHandle"></Calendar>
      <!-- 积分获取 -->
      <div class="listCont fx-sb">
        <div class="list">
          <div class="tit">获取积分</div>
          <!-- 拿不到就直说，不要摆一排 0/50 假装今天一分没得 -->
          <InlineError v-if="pointsStatus === 'error'" title="积分数据加载失败" :msg="pointsError"
                       @retry="getSignRecordsHandle" />
          <div class="tab" v-else>
            <div class="item fx-sb" v-for="item in access" :key="item.type">
              <span>{{item.type}}</span>
              <span>{{item.points}}/{{item.maxPoints}}</span>
            </div>
          </div>
        </div>
        <div class="listRt">
            <div class="tit fx-sb">
              <span>学霸天梯榜</span>
              <span class="more font-bt" @click="() => $router.push({name: 'myIntegralRanking', query:{rank: seasonsData.rank, points:seasonsData.points}})">更多&gt;</span>
            </div>
            <!-- 榜单拉不到时组件内部会显示「一条数据也没有～」，那是在说「没人上榜」，
                 和服务挂了是两回事，所以这里要单独拦掉 -->
            <InlineError v-if="rankStatus === 'error'" title="学霸榜加载失败" :msg="rankError"
                         @retry="getSeasonsData" />
            <IntegralRankTab v-else :data="seasonsData"></IntegralRankTab>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
// errMsg 取业务失败文案（禁止写 res.data.msg）；catchMsg 取网络层失败文案
import { errMsg, catchMsg } from "@/utils/request";
import { getSeasons, getTodayPoints, pointsSign } from "@/api/class.js";
import { useRoute } from "vue-router";
import { dataCacheStore } from "@/store"

// 组件导入
import CardsTitle from './components/CardsTitle.vue'
import Calendar from './components/Calendar.vue'
import IntegralRankTab from './components/IntegralRankTab.vue'
import InlineError from "@/components/InlineError.vue"

const route = useRoute()
const store = dataCacheStore()

const value = ref(new Date())

const access = ref([
  {value: 1, 'type': '课程学习', points:0, maxPoints: 50},
  {value: 2, 'type': '每日签到', points:0, maxPoints: 2},
  {value: 3, 'type': '课程问答', points:0, maxPoints: 20},
  {value: 4, 'type': '课程笔记', points:0, maxPoints: 20},
  {value: 5, 'type': '课程评价', points:0, maxPoints: 999},
])

// 课程目录
const classListData = ref([])
const baseClassTeacherData = ref([])

// mounted生命周期
onMounted(async () => {
 // 积分榜信息查询
 getSeasonsData()
 // 积分获得记录
 getSignRecordsHandle()
});

/** 方法定义 **/

// 积分榜信息查询
const seasonsData = ref([])
// 学霸榜 / 今日积分 各自独立的三态：两块数据互不影响，一个挂了不该拖累另一个
const rankStatus = ref('loading')
const rankError = ref('')
const getSeasonsData = async () => {
  rankStatus.value = 'loading'
  try {
    const res = await getSeasons({season:0, pageNo: 1, pageSize: 10})
    if (res && res.code == 200 && res.data) {
      seasonsData.value = res.data
      rankStatus.value = 'ok'
      return
    }
    rankError.value = errMsg(res, '学霸榜加载失败')
    rankStatus.value = 'error'
  } catch (err) {
    rankError.value = catchMsg(err, '学霸榜加载失败') || '请先登录后查看学霸榜'
    rankStatus.value = 'error'
  }
}
// 用户本日积分情况查询
const toadyPointsData = ref([])
const pointsStatus = ref('loading')
const pointsError = ref('')
const getSignRecordsHandle = async () => {
  pointsStatus.value = 'loading'
  try {
    const res = await getTodayPoints()
    if (res && res.code == 200) {
      // 当天没有任何积分记录时接口不返回 data，这里必须兜底成空数组，
      // 否则下面的 forEach 会抛 TypeError（code=200 + data 缺失是正常的「今天还没得分」）
      const records = res.data || []
      // 先按 type 建索引，避免 5 × N 的双层遍历
      const pointsMap = new Map(records.map(it => [it.type, it.points]))
      access.value.forEach(n => {
        n.points = pointsMap.get(n.type) || 0
      })
      toadyPointsData.value = records
      pointsStatus.value = 'ok'
      return
    }
    // code != 200：服务有问题，不能把 5 行都显示成 0/50
    pointsError.value = errMsg(res, '积分数据加载失败')
    pointsStatus.value = 'error'
  } catch (err) {
    pointsError.value = catchMsg(err, '积分数据加载失败') || '请先登录后查看积分'
    pointsStatus.value = 'error'
  }
}
// 打卡 - 返回积分
const pointsSignHandle = async () => {
  await pointsSign()
    .then((res) => {
      if (res.code == 200 ){
        ElMessage({
          message: '签到成功！',
          type: 'success'
        });
        // 签到会加积分：不重拉的话「每日签到」那行还是 0/2，和日历上的「已打卡」自相矛盾
        getSignRecordsHandle()
      } else {
        ElMessage({
          message: errMsg(res, '签到失败'),
          type: 'error',
          grouping: true
        });
      }
    })
    .catch((err) => {
      // 原来这里写的是「学霸榜请求失败！」—— 签到接口挂了个学霸榜的文案
      ElMessage({
        message: catchMsg(err, '签到失败，请稍后重试') || '签到失败',
        type: 'error',
        grouping: true
      });
    });
}

</script>
<style lang="scss" src="./index.scss"> </style>
