<!-- 学习练习 -->
<template>
  <div class="practiseWrapper">
    <!-- 试题没拿到时给常驻面板 + 重试，而不是弹一条 toast 之后留一片空白：
         左边答题卡是空的、右边一整块白，看着像页面坏了，用户也不知道能重试 -->
    <div v-if="status === 'error'" class="loadFailed">
      <p class="tit">试题加载失败</p>
      <p class="sub">{{ errorMsg }}</p>
      <el-button type="primary" @click="getSubjectList">重新加载</el-button>
    </div>
    <div v-else-if="status === 'loading'" class="loadFailed">
      <p class="sub">正在加载试题…</p>
    </div>
    <template v-else>
    <div class="preview">
      <div class="previewTit">答题卡</div>
      <div class="previewList">
        <span v-for="(item, index) in params"
          :class="{act: item && item.answers != undefined && String(item.answers) != ''}" :key="index">{{index +
          1}}</span>
      </div>
      <div class="previewSub" @click="submit"><span class="bt">提交试卷</span></div>

    </div>
    <div class="ExQuestions" v-infinite-scroll="load" style="overflow: auto">
      <div class="questions" v-for="(item, index) in subjectList" :key="index">
        <div class="title fx" v-html="` <p>${index+1}. ${subjectTypeWt(item.type)}</p>${item.name}`"></div>
        <!-- 不同的题型展示不同的题 1：单选题，2：多选题，3：不定向选择题，4：判断题，5：主观题 -->
        <div v-if="item.type == 1">
          <el-radio-group v-model="item.answers" class="ml-4">
            <el-radio :label="ind+1" v-for="(it, ind) in item.options" :key="it" size="large">
              <div class="fx"><span>{{upperAlpha(ind)}}</span><span v-html="it"></span></div>
            </el-radio>
          </el-radio-group>
        </div>
        <div v-if="item.type == 2">
          <el-checkbox-group v-model="item.answers">
            <el-checkbox v-for="(it, ind) in item.options" :label="ind+1" :key="it">
              <div class="fx"><span>{{upperAlpha(ind)}}</span><span v-html="it"></span></div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div v-if="item.type == 3">
          <el-checkbox-group v-model="item.answers">
            <el-checkbox v-for="(it, ind) in item.options" :label="ind+1" :key="it">
              <div class="fx"> <span>{{upperAlpha(ind)}}</span><span v-html="it"></span></div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div v-if="item.type == 4">
          <el-radio-group v-model="item.answers" class="ml-4">
            <el-radio :label="true" size="large">A. 正确</el-radio>
            <el-radio :label="false" size="large">B. 错误</el-radio>
          </el-radio-group>
        </div>
        <div v-if="item.type == 5">
          <el-input type="textarea" class="textArea" rows="5" maxlength="200" v-model="item.answers"
            placeholder="请输入正确答案" show-word-limit></el-input>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>
<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSubject, postSubject } from '@/api/subject.js';
// errMsg：统一取后端错误提示（不要写 res.data.msg —— 业务失败时响应体里没有 data 字段）
import { errMsg } from '@/utils/request';
import { dataCacheStore } from "@/store"

const store = dataCacheStore()
const currentPlayData = ref({})

// 接收传过来的参数
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  examInfo: {
    type: Object
  },
})

const emit = defineEmits(['goHandle', 'playHadle'])
// 生命周期
onMounted(() => {
  currentPlayData.value = JSON.parse(JSON.stringify(store.getCurrentPlayData))
  currentPlayData.value.name = currentPlayData.value.sectionName
  // 根据小节或测试id获取练习题
  getSubjectList()
})
// 添加题型
const subjectTypeWt = (type) => {
  let str = ''
  switch (type) {
    case 1:
      str = ' (选择题) ';
      break
    case 2:
      str = ' (多选题) ';
      break
    case 3:
      str = ' (不定项选择题) ';
      break
    case 4:
      str = ' (判断题) ';
      break
    case 5:
      str = ' (主观题) ';
      break
  }
  return str
}

// 添加 A、B、C、D
const upperAlpha = (num) => {
  let str = ''
  switch (num) {
    case 0:
      str = 'A.';
      break
    case 1:
      str = 'B.';
      break
    case 2:
      str = 'C.';
      break
    case 3:
      str = 'D.';
      break
    case 4:
      str = 'E.';
      break
    case 5:
      str = 'F.';
      break
    case 6:
      str = 'G.';
      break
  }
  return str
}

// 根据小节或测试id获取练习题
const subjectList = ref([])
// 试题加载三态：loading / ok / error。
// 原来失败只弹一条 toast，页面继续渲染「空答题卡 + 提交试卷按钮 + 一整块空白」，
// 看着像页面坏了，而且用户不知道还能不能重试。
const status = ref('loading')
const errorMsg = ref('')
// 后端「开始考试」不再落库，改由前端记录进入答题页的时间，交卷时把用时带过去
const examStartTime = ref(0)
const getSubjectList = async () => {
  status.value = 'loading'
  let res
  try {
    res = await getSubject(props.examInfo)
  } catch (e) {
    // 网络层失败（超时/断网）不会带业务体，只能给兜底文案
    errorMsg.value = '网络异常，请检查网络后重试'
    status.value = 'error'
    return
  }
  if (res.code === 200 && res.data && Array.isArray(res.data.questions)) {
    // 计时从「题目真的拿到」开始算，别把请求耗时算进考试用时里
    examStartTime.value = Date.now();
    subjectList.value = res.data.questions
    status.value = 'ok'
    return
  }
  // code=200 但一道题都没有（试卷是空的）也要说清楚，否则会渲染出一个空答题页
  errorMsg.value = res.code === 200 ? '这套题暂时没有内容，请稍后再试' : errMsg(res, '试题加载失败')
  status.value = 'error'
}

// 是否已经提交试卷
const isSubmit = ref(false)

// 确认提交试卷
const params = ref(subjectList)
const submit = () => {
  const Effective = params.value.filter(n => n.answers != "" && n.answers != undefined)
  if (Effective.length < subjectList.value.length) {
    ElMessageBox.confirm(
      `还有未提交答案，是否要提交答卷。`,
      '确认交卷',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '我再看看',
        type: 'warning',
      }
    )
      .then(() => {
        postSubjectHandle()
      })
      .catch(() => {
      })
  } else {
    postSubjectHandle()
  }
}

// 提交了
const postSubjectHandle = async () => {
  const param = params.value.map(el => {
    // 单选/判断题的 answers 是数字/布尔，主观题是字符串，只有多选才是数组，
    // 直接调 .sort() 会抛 TypeError，这里统一转成逗号分隔的字符串再提交
    const raw = el.answers
    let answer = ''
    if (Array.isArray(raw)) {
      answer = raw.slice().sort((i1, i2) => parseInt(i1) - parseInt(i2)).join(',')
    } else if (raw !== undefined && raw !== null) {
      answer = String(raw)
    }
    return { questionId: el.id, answer, questionType: el.type }
  });
  // 考试记录改到「提交试卷」时才创建，所以要带上定位信息（sectionId/courseId/type）
  const duration = examStartTime.value ? Math.floor((Date.now() - examStartTime.value) / 1000) : 0
  await postSubject({ ...props.examInfo, duration, examDetails: param })
    .then((res) => {
      if (res.code === 200) {
        subjectList.value = res.data
        isSubmit.value = true
        ElMessage({
          message: '答案提交成功, 请前往个人中心查看',
          type: 'success'
        })
        emit('playHadle', { item: currentPlayData.value, tp: '9' })
      } else {
        ElMessage({ message: errMsg(res, '交卷失败'), type: 'error', grouping: true })
      }
    })
    .catch(() => {
      // 原来这里写的是「学习计划获取请求出错！」，跟交卷八竿子打不着，排查时极其误导
      ElMessage({ message: '交卷失败，请检查网络后重试', type: 'error', grouping: true })
    });
}

// 组件卸载前提醒交卷
onBeforeUnmount(() => {
  leaveConfirm()
})
// 已经答题但没提交前的校验
function leaveConfirm() {
  if (isSubmit.value) {
    return false;
  }
  const Effective = params.value.filter(n => n.answers != "" && n.answers != undefined)
  if (Effective.length > 0) {
    ElMessageBox.confirm(
      `还有未提交答案，是否要提交答卷。`,
      '确认交卷',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '我再看看',
        type: 'warning',
      }
    )
      .then(() => {
        postSubjectHandle()
      })
      .catch(() => {
      })
  }
}
// 习题一次性返回全部数据，无需分页，这里只是 v-infinite-scroll 的占位回调
const load = () => { }
</script>
<style lang="scss" scoped>
.practiseWrapper {
  background-color: black;
  color: black;
  height: calc(100vh - 60px);
  padding: 30px;
  display: flex;

  /* 试题加载中 / 加载失败时的占位（黑底，和左侧视频区同一套观感） */
  .loadFailed {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .tit {
      font-size: 18px;
      color: #E6E6E6;
    }

    .sub {
      font-size: 14px;
      color: #B5B5B5;
      margin-bottom: 12px;
    }
  }

  .preview {
    width: 188px;
    height: max-content;
    background: #FFFFFF;
    margin-right: 20px;
    padding: 15px;

    .previewTit {
      font-size: 14px;
      color: var(--color-font1);
      margin-bottom: 20px;
    }

    .previewList {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      margin-bottom: 30px;

      span {
        display: inline-block;
        width: 22px;
        line-height: 22px;
        border: 1px solid #80878C;
        color: #80878C;
        border-radius: 2px;
        margin-right: 10px;
        margin-bottom: 10px;
        text-align: center;
      }

      span:nth-child(5n) {
        margin-right: 0px;
      }

      .act {
        color: #fff;
        background: var(--color-success);
        border: 1px solid var(--color-success);
      }
    }

    .previewSub {
      width: 80px;
      height: 28px;
      border-radius: 3px;
      margin: 0 auto;

      .bt {
        font-size: 14px;
        line-height: 28px;
      }
    }
  }

  .ExQuestions {
    background-color: #FFFFFF;
    flex: 1;
    padding: 30px;

    .textArea {
      width: 100%;
    }

    .title {
      margin: 16px 0;
    }
  }
}
</style>
