<!-- 我的考试 -->
<template>
  <div class="myExamDetails">
     <div class="examHeadle">
      <!-- 返回箭头贴在标题左边（.withBack 见 index.scss） -->
      <div class="tit withBack"><BackArrow />考试批阅</div>
      <div class="table">
        <div class="fx-sb">
          <div class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">所属课程</div>
            <div>{{$route.query.courseName}}</div>
          </div>
          <div  class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">测试名称</div>
            <div>{{$route.query.sectionName}}</div>
          </div>
          <div  class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">学员名称</div>
            <div>{{stroe.getUserInfo.name}}</div>
          </div>
        </div>
        <div class="fx-sb">
          <div class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">所用时长</div>
            <div>{{$route.query.duration ? timeFormat($route.query.duration) : '00 : 00 : 00'}} </div>
          </div>
          <div  class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">提交时间</div>
            <div>{{$route.query.commitTime}}</div>
          </div>
          <div  class="td fx-1">
            <div class="marg-bt-10 ft-wt-600 ft-cl-1">总 分 数</div>
            <div>{{$route.query.score || 0}} / {{total}}</div>
          </div>
        </div>
      </div>
     </div>
     <div class="answerCardTitle" v-if="myExamDetails">答题卡</div>
     <div class="answerCards">
      <span v-for="(item, index) in myExamDetails" :key="index" :class="{right:item.correct,wrong:!item.correct && item.answer != ''}">{{index + 1}}</span>
     </div>
     <div class="examCont" >
        <div class="item" v-for="(item, index) in myExamDetails" :key="index">
        <div class="examTitle">
          <div>
            <img v-if="item.correct" src="@/assets/icon_right.png" alt="">
            <img v-else src="@/assets/icon_wrong.png" alt="">
          </div>
          <div class="quest fx">
            {{index+1}}. <span v-html="item.question.name"></span>
          </div>
        </div>
        <div class="answer">
          <li v-for="(it, i) in item.question.options" :key="i"><span>{{ upperAlpha(i) }}&nbsp;</span><span v-html="it"></span></li>
        </div>
        <div class="analysis">
          <div class="fx marg-bt-20">
            <div class="col ft-wt-600">你的答案：{{answerChange(item.question.type, item.answer)}}</div>
            <div class="col rt ft-wt-600">正确答案：{{answerChange(item.question.type, item.question.answer)}}</div>
            <div class="col">难易程度：{{defficultyChange(item.question.difficulty)}}</div>
            <div>得分：{{item.score}}</div>
          </div>
          <div class="fx" v-if="item.question.analysis">答案解析：<span v-html="item.question.analysis"></span></div>
        </div>
        </div>
     </div>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { onMounted, ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { getExamDetails } from "@/api/class.js";
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
import { upperAlpha, timeFormat } from "@/utils/tool.js"
import { useRoute } from "vue-router";
import { useUserStore } from '@/store'


// 组件导入
import BackArrow from './components/BackArrow.vue'

const stroe = useUserStore()
const route = useRoute();

// mounted生命周期
onMounted(async () => {
  // 查询我的考试记录
  getExamDetailsData()
});

/** 方法定义 **/

// 查询我的考试记录
const total = ref(0)
// 查询我的详情
const myExamDetails = ref()
const getExamDetailsData = async () => {
  await getExamDetails(route.query.id)
    .then((res) => {
      if (res.code == 200 && res.data != null){
        myExamDetails.value = res.data
        res.data.forEach(el => {
          total.value += el.question.score
        });
      } else {
        // 答题卡与题目都靠 myExamDetails 渲染，失败时页面只剩表头，必须给提示
        ElMessage({message: errMsg(res), type: 'error', grouping: true})
      }
    })
    .catch(() => {
      ElMessage({
        message: "最近学习数据请求出错！",
        type: 'error'
      });
    });
}
// 问题类型，1：单选题，2：多选题，3：不定向选择题，4：判断题，5：主观题
const answerChange = (type, val) => {
  let data = ''
  switch (parseInt(type)){
    case 1 : {
      // 题库答案存的是 1-based 选项序号，upperAlpha 是 0-based，必须减 1
      data = (val === '' || val === null || val === undefined)
        ? '' : (isNaN(Number(val)) ? val : upperAlpha(Number(val) - 1))
      break
    }
    // 原写法 case 2 || 3 在 JS 里等价于 case 2，不定项选择题(3)永远匹配不到
    case 2 :
    case 3 : {
      if (val === '' || val === null || val === undefined) break
      const arr = typeof val == 'string' ? val.split(',') : (Array.isArray(val) ? val : [])
      data = arr.filter(n => n !== '' && n !== null && n !== undefined)
        .map(n => isNaN(Number(n)) ? n : upperAlpha(Number(n) - 1))
        .join(',')
      break
    }
    case 4 : {
      // 提交上来的是 "true"/"false" 字符串，直接 val ? 会把 "false" 判成真值
      data = (val === true || val === 1 || val === 'true' || val === '1') ? '正确' : '错误'
      break
    }
    case 5 : {
      data = val
      break
    }
  }
  return data
}
const defficultyChange = (item) => {
 return item == 1 ? '简单' : item == 2 ? '中等' : '困难'
}
</script>
<style lang="scss" src="./index.scss"> </style>
