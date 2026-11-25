<!-- 学习笔记（学习中心新增二级页）
     数据：GET /ls/notes/page，onlyMine 切换「我的 / 全部」。
     笔记接口一直存在（课程播放页右侧在用），学习中心之前完全没有入口。 -->
<template>
  <div class="notesPage">
    <header class="npHead">
      <div>
        <h1>学习笔记</h1>
        <!-- 不再写「点开回到对应小节」：每条右侧已有「回到这一节 →」明确入口，说明文字是冗余 -->
        <p v-if="status === 'ok'">共 <b>{{ total }}</b> 条{{ onlyMine ? '（我的）' : '（全站公开）' }}</p>
        <p v-else>把每节课的关键句记下来，复习时不用重看视频</p>
      </div>
      <div class="npTabs">
        <span :class="{ on: onlyMine }" @click="switchMine(true)">我的笔记</span>
        <span :class="{ on: !onlyMine }" @click="switchMine(false)">全部笔记</span>
      </div>
    </header>

    <div class="npCard" :class="{ refreshing }">
      <template v-if="status === 'ok' && items.length > 0">
        <NoteCard v-for="n in items" :key="n.id" :note="n" jump @open="openNote" />
        <div class="npPager" v-if="total > pageSize">
          <el-pagination background layout="prev, pager, next" :total="total"
                         :page-size="pageSize" :current-page="pageNo"
                         @current-change="turnPage" />
        </div>
      </template>
      <div class="npEmpty" v-else-if="status === 'ok'">
        <p>{{ onlyMine ? '还没有写过笔记' : '还没有公开笔记' }}</p>
        <span>在课程播放页右侧「笔记」里随手记一句，会自动带上视频位置</span>
      </div>
      <div class="npState" v-else-if="status === 'error'">
        <InlineError title="笔记加载失败" :msg="errorMsg" @retry="load" />
      </div>
      <div class="npState" v-else>
        <span class="npTip fadeInDelay">正在加载…</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAllNotes } from '@/api/notes.js'
import { errMsg, catchMsg } from '@/utils/request'
import NoteCard from '@/components/ui/NoteCard.vue'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
const items = ref([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = 12
const onlyMine = ref(true)
const status = ref('loading')
const errorMsg = ref('')
// 切换「我的/全部」或翻页时的刷新态：保持旧列表 + 轻微变淡，
// 不再把 status 打回 loading（否则会在数据到达前闪一句「正在加载…」，观感很差）
const refreshing = ref(false)

/**
 * @param {boolean} silent 静默刷新（切换 tab / 翻页）：不切 loading 态
 */
const load = async (silent = false) => {
  if (silent) refreshing.value = true
  else status.value = 'loading'
  try {
    const res = await getAllNotes({ pageNo: pageNo.value, pageSize, onlyMine: onlyMine.value })
    if (res.code == 200 && res.data) {
      items.value = res.data.list || []
      total.value = Number(res.data.total) || 0
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '笔记加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '笔记加载失败') || '请先登录后查看笔记'
    status.value = 'error'
  } finally {
    refreshing.value = false
  }
}
onMounted(() => load())

const switchMine = (mine) => {
  if (onlyMine.value === mine) return
  onlyMine.value = mine
  pageNo.value = 1
  load(true)
}
const turnPage = (p) => {
  pageNo.value = p
  load(true)
}

// 有 courseId 才能回到对应小节；没有就只当一条笔记看
const openNote = (n) => {
  if (!n || !n.courseId) return
  const query = { id: n.courseId }
  if (n.sectionId) query.sectionId = n.sectionId
  router.push({ path: '/learning/index', query })
}
</script>
<style lang="scss" scoped>
.npHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  h1 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -.4px;
    color: var(--ink);
  }
  p {
    margin-top: 7px;
    font-size: 13px;
    color: var(--ink3);
    b {
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 400;
      color: var(--ink);
    }
  }
}
.npTabs {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 999px;
  flex: none;
  span {
    height: 30px;
    padding: 0 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    font-size: 12.5px;
    color: var(--ink2);
    cursor: pointer;
    &.on {
      background: var(--main);
      color: #fff;
    }
  }
}
.npCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 6px 26px 20px;
  transition: opacity .15s;
  // 静默刷新：旧内容变淡表示「正在换」，比闪一句加载提示稳
  &.refreshing {
    opacity: .45;
    pointer-events: none;
  }
}
.npPager {
  display: flex;
  justify-content: center;
  padding-top: 18px;
}
.npEmpty {
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
  span {
    font-size: 12px;
    color: var(--ink3);
  }
}
.npState {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.npTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
