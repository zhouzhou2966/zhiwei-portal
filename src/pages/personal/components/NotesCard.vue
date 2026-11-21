<!-- 概览 · 我的笔记（最近 3 条）
     数据：GET /ls/notes/page?onlyMine=true —— 笔记接口一直有，学习中心之前没接。
     点「回到这一节」跳播放页对应小节（播放页支持 query.sectionId，精确到秒需要它再读 t，
     所以这里只承诺「小节」，不承诺「秒」）。 -->
<template>
  <div class="notesCard" v-if="status === 'ok' && items.length > 0">
    <div class="ntRow" v-for="n in items" :key="n.id">
      <p class="ntTxt" :title="n.content">{{ n.content }}</p>
      <div class="ntMeta">
        <span class="ntFrom">{{ n.courseName || '课程笔记' }}</span>
        <span class="ntTime">{{ fmtTime(n.createTime) }}</span>
      </div>
      <div class="ntOps">
        <span class="ntMoment" v-if="n.noteMoment != null">视频 {{ fmtMoment(n.noteMoment) }}</span>
        <span class="ntGo" v-if="n.courseId" @click="goSection(n)">回到这一节 →</span>
      </div>
    </div>
  </div>

  <div class="ntEmpty" v-else-if="status === 'ok'">
    <p>还没有写过笔记</p>
    <span>在课程播放页的右侧「笔记」里随手记一句</span>
  </div>
  <div class="ntState" v-else-if="status === 'error'">
    <InlineError title="笔记加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="ntState" v-else>
    <span class="ntTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAllNotes } from '@/api/notes.js'
import { errMsg, catchMsg } from '@/utils/request'
import { dayjs } from '@/utils/date'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
const items = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getAllNotes({ pageNo: 1, pageSize: 3, onlyMine: true })
    if (res.code == 200 && res.data) {
      items.value = res.data.list || []
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '笔记加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '笔记加载失败') || '请先登录后查看笔记'
    status.value = 'error'
  }
}
onMounted(load)

const fmtTime = (t) => (t ? dayjs(t).format('M/D HH:mm') : '')
// noteMoment 是笔记所在的视频秒数
const fmtMoment = (s) => {
  const n = Number(s) || 0
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

const goSection = (n) => {
  const query = { id: n.courseId }
  if (n.sectionId) query.sectionId = n.sectionId
  router.push({ path: '/learning/index', query })
}
</script>
<style lang="scss" scoped>
.notesCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 4px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}
.ntRow {
  padding: 14px 0;
  border-bottom: 1px dashed var(--line);
  &:last-child {
    border-bottom: none;
  }
}
.ntTxt {
  font-size: 13.5px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}
.ntMeta {
  margin-top: 5px;
  display: flex;
  gap: 10px;
  font-size: 11.5px;
  color: var(--ink3);
  min-width: 0;
}
.ntFrom {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}
.ntOps {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
}
.ntMoment {
  font-family: var(--font-serif);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  color: var(--main);
  background: var(--main-soft);
  border-radius: 5px;
  padding: 1px 7px;
}
.ntGo {
  font-size: 12px;
  color: var(--main);
  cursor: pointer;
  margin-left: auto;
  &:hover {
    color: var(--main-deep);
  }
}
.ntEmpty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  justify-content: center;
  min-height: 100%;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
  span {
    font-size: 12px;
    color: var(--ink3);
  }
}
.ntState {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.ntTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
