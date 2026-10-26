<!-- 个人中心 - 全部课程（从「我的课程」拆出的独立页面） -->
<template>
  <div class="allClassWrapper">
    <!-- 返回箭头贴「全部课程」标题左边（CardsTitle 的 back）。
         点击逻辑走 BackArrow：有站内来源就 back()，直接输地址/刷新进来则按 meta.active
         回「我的课程」—— 正是这个页面的父页面，不用再单独传 fallback -->
    <div class="personalCards">
      <CardsTitle title="全部课程" back>
        <span class="clsEntryRight">
          <span class="clsEntryCount">共 {{count}} 门</span>
        </span>
      </CardsTitle>

      <div class="clsGrid" v-if="lessonList.length > 0">
        <ClassGridCard
            v-for="item in lessonList"
            :key="item.id"
            :data="item"
            @planHandle="planHandle"
        />
      </div>

      <!-- 空状态：没有课程时如果只留白，看起来像页面坏了 -->
      <div class="clsEmpty" v-else-if="!loading">
        还没有课程，去 <span class="clsLink" @click="$router.push('/')">课程首页</span> 看看
      </div>

      <div class="pageination" v-show="count > 0">
        <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="count"
            v-model:current-page="params.pageNo"
            v-model:page-size="params.pageSize"
            :page-sizes="[9, 18, 36]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建 / 修改学习计划 -->
    <el-dialog
        v-model="dialogVisible"
        :title="title"
        width="30%"
    >
      <div class="dialogCont">
        <div class="fx marg-bt-20"><span>每周学习节数:</span>
          <el-input @input="planDayHandle" v-model="number" min="1" type="number"></el-input>
        </div>
        <div class="fx"><span>预计学完时间:</span>
          <div class="lastTime">{{ lastTime }}</div>
        </div>
      </div>
      <template #footer>
          <span class="dialogFooter">
            <div @click="dialogVisible = false"><span class="bt bt-grey">取消</span></div>
            <div @click="createPlan"><span class="bt">确定</span></div>
          </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>

import {computed, onMounted, reactive, ref} from "vue";
import {ElMessage} from "element-plus";
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import {errMsg} from '@/utils/request'
import {getMylessons, creatPlans, delMyClass} from "@/api/class.js";
import { dayjs } from '@/utils/date'
import CardsTitle from './components/CardsTitle.vue'
import ClassGridCard from './components/ClassGridCard.vue'

// 每页 9 条 = 三列三行，正好铺满不留半行
const PAGE_SIZE = 9

const lessonList = ref([])
const count = ref(0)
const loading = ref(false)
// 必须是 reactive：分页组件用 v-model 双向绑定页码和每页条数，
// 普通对象改属性不会触发视图更新，页码会卡住不动
const params = reactive({
  pageNo: 1,
  pageSize: PAGE_SIZE,
})

onMounted(() => {
  getLessonsData()
});

const getLessonsData = async () => {
  loading.value = true
  await getMylessons(params)
      .then((res) => {
        if (res.code == 200 && res.data != null) {
          lessonList.value = res.data.list || []
          count.value = Number(res.data.total) || 0
        } else {
          ElMessage({message: errMsg(res), type: 'error', grouping: true})
        }
      })
      .catch(() => {
        ElMessage({
          message: "课程列表请求出错！",
          type: 'error'
        });
      })
      .finally(() => {
        loading.value = false
      });
}

// v-model 已经把值写回 params，这里只负责「改每页条数要回到第一页」和重新拉数据
const handleSizeChange = () => {
  params.pageNo = 1
  getLessonsData()
}
const handleCurrentChange = () => {
  getLessonsData()
}

/** 学习计划弹窗 **/
const dialogVisible = ref(false)
const title = ref('创建计划')
const currentData = ref()
const days = ref(0)
const number = ref(1)

const lastTime = computed(() => {
  // 每周学 n 节，m = 总节数/n 不足一周按一周算，从今天开始往后延 m*7 天
  const num = Math.ceil(days.value / number.value) * 7
  return number.value ? dayjs().add(num, 'day').format("YYYY-MM-DD") : ''
})

// 每周节数限制在 1~50
const planDayHandle = val => {
  val != '' && val < 1 ? number.value = 1 :
      val != '' && val > 50 ? number.value = 50 : null
}

const planHandle = (val) => {
  const {data, type} = val
  if (type == 'del') {
    delCourse(data.courseId)
    return
  }
  dialogVisible.value = true
  currentData.value = data
  days.value = data.sections
  if (type == 'edit') {
    number.value = data.weekFreq
    title.value = '修改计划'
  } else {
    title.value = '创建计划'
  }
}

const createPlan = async () => {
  const req = {
    freq: number.value,
    courseId: currentData.value ? currentData.value.courseId : ''
  }
  await creatPlans(req)
      .then((res) => {
        if (res.code == 200) {
          ElMessage({
            message: `${title.value}成功`,
            type: 'success'
          });
          dialogVisible.value = false
          // 计划状态会影响卡片上显示「创建计划」还是「修改计划」，必须刷新列表
          getLessonsData()
        } else {
          // 用户主动操作失败必须给提示，否则表现为「点了没反应」
          ElMessage({message: errMsg(res), type: 'error', grouping: true})
        }
      })
      .catch(() => {
        ElMessage({
          message: "计划保存失败！",
          type: 'error'
        });
      });
}

// 删除已失效的课程（只删课表记录，不影响订单和已学记录）
const delCourse = async (courseId) => {
  await delMyClass(courseId)
      .then((res) => {
        if (res.code == 200) {
          // 删掉最后一条时当前页会空掉，往前退一页，避免停在一个空列表上
          if (lessonList.value.length === 1 && params.pageNo > 1) {
            params.pageNo -= 1
          }
          getLessonsData()
        } else {
          ElMessage({message: errMsg(res), type: 'error', grouping: true})
        }
      })
      .catch(() => {
        ElMessage({
          message: "删除课程失败！",
          type: 'error'
        });
      });
}
</script>
<style lang="scss" src="./index.scss"></style>
