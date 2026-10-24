<!-- 我的积分 - 天梯榜 -->
<template>
  <div class="myInterralRankingWrapper">
    <div class="personalCards">
      <!-- 返回箭头由 CardsTitle 的 back 直接画在标题左边，不再单独占一行 -->
      <CardsTitle class="marg-bt-20" title="学霸天梯榜" back />
      <div class="listCont fx-sb">
        <div class="listRt">
          <!-- 本赛季是第几赛季：season 表按月一行，取覆盖今天的那行；
               表没维护到本月时退回列表最后一项（与下拉「本赛季=最后一项」口径一致） -->
          <div class="tit">本赛季榜<span v-if="currentSeasonName" class="seasonTag">{{ currentSeasonName }}</span></div>
          <!-- 服务挂了要给常驻提示 + 重试：原来只有一条 3 秒就消失的 toast，
               用户切回来只看到一张空榜，会以为是「本来就没数据」 -->
          <InlineError v-if="curStatus === 'error'" title="本赛季榜加载失败" :msg="curError"
                       @retry="() => getSeasonsData(0)" />
          <IntegralRankTab v-else :data="currentSeasonsData"></IntegralRankTab>
        </div>
        <div class="listRt">
          <div class="tit fx-sb">
            <span>历史榜</span>
            <div>
              <!-- 赛季列表拉不到时不要留一个「0」在框里：season 的初值 0 表示「当前赛季」，
                   没有选项时 el-select 会把原始值 0 直接显示出来，看着像数据错乱 -->
              <el-select v-if="seasonOptions.length" v-model="season" @change="selectHandle"
                         class="m-2" placeholder="选择赛季">
                <el-option
                  v-for="item in seasonOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <!-- 榜单自己已经报错时就不再叠一条「赛季列表加载失败」，避免同一块出现两行错误 -->
              <span v-else-if="hisStatus !== 'error'" class="seasonEmpty">赛季列表加载失败</span>
            </div>
          </div>
          <InlineError v-if="hisStatus === 'error'" title="历史榜加载失败" :msg="hisError"
                       @retry="retryHistory" />
          <IntegralRankTab v-else :data="seasonsData"></IntegralRankTab>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { computed, onMounted, ref } from "vue";
// errMsg / catchMsg：业务失败时响应体没有 data 字段，不能读 res.data.msg（见 utils/request.js）
import { errMsg, catchMsg } from "@/utils/request";
import { getSeasons, getSelectOptions } from "@/api/class.js";
import { useRoute } from "vue-router";
import { dataCacheStore } from "@/store"

// 组件导入
import CardsTitle from './components/CardsTitle.vue'
import IntegralRankTab from './components/IntegralRankTab.vue'
import InlineError from "@/components/InlineError.vue"

const route = useRoute()
const store = dataCacheStore()

const value = ref(new Date())

const access = ref([
  {'title': '课程学习', status: true},
  {'title': '课程评论', status: false},
  {'title': '课程问答', status: false},
  {'title': '课程笔记', status: false},
  {'title': '签到', status: false},
])

// 课程目录
const classListData = ref([])
const baseClassTeacherData = ref([])

// mounted生命周期
onMounted(async () => {
 // 下拉参数获取 - 赛季列表
  getHistorySeasonsData()
 // 当前赛季 
 await getSeasonsData(0)
});

/** 方法定义 **/
// 积分榜信息查询
// 当前赛季
const currentSeasonsData = ref([])
// 历史榜（首次进来先显示本赛季）
const seasonsData = ref([])
// 两块各自独立的三态：一个挂了不该拖累另一个（同 myIntegral.vue 的口径）
const curStatus = ref('loading')
const curError = ref('')
const hisStatus = ref('loading')
const hisError = ref('')

// season == 0 表示「本赛季」，其余是历史榜下拉选中的赛季
const getSeasonsData = async (season) => {
  const isCurrent = season == 0
  if (isCurrent) {
    curStatus.value = 'loading'
    hisStatus.value = 'loading'
  } else {
    hisStatus.value = 'loading'
  }
  try {
    const res = await getSeasons({season, pageNo: 1, pageSize: 10})
    if (res && res.code == 200 && res.data) {
      if (isCurrent) {
        // 首次进来历史榜也先展示本赛季，所以两块一起置 ok
        currentSeasonsData.value = res.data
        seasonsData.value = res.data
        curStatus.value = 'ok'
        hisStatus.value = 'ok'
      } else {
        seasonsData.value = res.data
        hisStatus.value = 'ok'
      }
      return
    }
    const msg = errMsg(res, '学霸榜加载失败')
    if (isCurrent) {
      curError.value = msg
      curStatus.value = 'error'
    }
    hisError.value = msg
    hisStatus.value = 'error'
  } catch (err) {
    const msg = catchMsg(err, '学霸榜加载失败') || '请先登录后查看学霸榜'
    if (isCurrent) {
      curError.value = msg
      curStatus.value = 'error'
    }
    hisError.value = msg
    hisStatus.value = 'error'
  }
}
// 历史下拉信息查询
const season = ref(0)
const seasonOptions = ref([])
const getHistorySeasonsData = async () => {
  try {
    const res = await getSelectOptions()
    // 空数组要挡住：原来直接取 res.data[length-1].id 会在「赛季表为空」时抛 TypeError
    if (res && res.code == 200 && Array.isArray(res.data) && res.data.length) {
      // 最后一个赛季的 id 置 0：后端约定 season=0 就是当前赛季，下拉里必须有这一项
      res.data[res.data.length - 1].id = 0
      seasonOptions.value = res.data
    }
  } catch (e) {
    // 赛季下拉拉不到只影响「切历史赛季」，榜单本身还正常显示，不抢榜单的失败态
    seasonOptions.value = []
  }
}
// 历史榜重试：赛季列表和当前榜单一起重拉
const retryHistory = () => {
  getHistorySeasonsData()
  getSeasonsData(season.value)
}
// 选择赛季
const selectHandle = (val) => {
  getSeasonsData(val)
}
/**
 * 本赛季是第几赛季。
 * season 表是一月一个赛季（beginTime/endTime 是 yyyy-MM-dd 字符串），所以：
 * ① 优先取时间区间覆盖「今天」的那一行；
 * ② 赛季表没维护到本月时（实测只到第12赛季 2026-09，今天 2026-10 落在表外），
 *    退回列表最后一项 —— 下拉里「本赛季」也是按最后一项处理的（id 置 0），两处口径必须一致，
 *    否则标题写一个赛季、下拉默认选另一个赛季，看着像数据错乱；
 * ③ 一个都拿不到就不渲染标签，不硬编赛季号。
 */
const currentSeasonName = computed(() => {
  const list = seasonOptions.value
  if (!list.length) return ''
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const hit = list.find(it => it.beginTime && it.endTime && it.beginTime <= today && today <= it.endTime)
  const target = hit || list[list.length - 1]
  return (target && target.name) || ''
})
</script>
<style lang="scss" src="./index.scss"> </style>
