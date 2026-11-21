<!-- 概览 · 学习排行（我的名次 + 前三）
     数据：GET /ls/boards?season=0（本赛季，返回 {rank, points, boardList}）。
     榜单之前在个人中心的「学霸天梯榜」里，学习中心没有任何排名信息。 -->
<template>
  <div class="rankCard" v-if="status === 'ok' && (hasMe || top.length > 0)">
    <div class="rkHead">
      <span>学习排行</span>
      <em>{{ seasonText }}</em>
    </div>

    <div class="rkMe" v-if="hasMe">
      <b>{{ data.rank || '-' }}</b>
      <i>我的名次</i>
      <span>{{ data.points || 0 }} 分</span>
    </div>
    <div class="rkMe empty" v-else>
      <span>本赛季还没有积分记录，学一节就开始计分</span>
    </div>

    <div class="rkList" v-if="top.length">
      <div v-for="(it, i) in top" :key="i">
        <em>{{ i + 1 }}</em>
        <span>{{ it.name || '知微学员' }}</span>
        <b>{{ it.points }}</b>
      </div>
    </div>

    <!-- 榜单只有一个宿主：个人中心的「学霸天梯榜」（本赛季 + 历史赛季）。
         学习中心只做摘要，不重复实现一份榜单。 -->
    <span class="rkMore" @click="$router.push({ name: 'myIntegralRanking' })">完整榜单 →</span>
  </div>

  <div class="rkEmpty" v-else-if="status === 'ok'">
    <p>还没上榜</p>
    <span>学完一节、发一条笔记都会进榜</span>
  </div>
  <div class="rkState" v-else-if="status === 'error'">
    <InlineError title="排行榜加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="rkState" v-else>
    <span class="rkTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { getSeasons } from '@/api/class.js'
import { errMsg, catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'

const data = ref({})
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getSeasons({ season: 0, pageNo: 1, pageSize: 3 })
    if (res.code == 200 && res.data) {
      data.value = res.data
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '排行榜加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '排行榜加载失败') || '请先登录后查看排行'
    status.value = 'error'
  }
}
onMounted(load)

// 本赛季没有数据时后端只回空对象（rank/points 都是 null），不挂「我 - -」这种噪音行
const hasMe = computed(() => !!(data.value.rank || data.value.points))
const top = computed(() => (data.value.boardList || []).slice(0, 3))
// 赛季号接口没直接给名字：榜接口返回里没有 name 字段时就不硬编
const seasonText = computed(() => data.value.seasonName || '本赛季')
</script>
<style lang="scss" scoped>
.rankCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.rkHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  span {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  em {
    font-style: normal;
    font-size: 11.5px;
    color: var(--ink3);
  }
}
.rkMe {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 14px;
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 30px;
    font-weight: 400;
    line-height: 1;
    color: var(--ink);
  }
  i {
    font-style: normal;
    font-size: 12px;
    color: var(--ink3);
  }
  span {
    margin-left: auto;
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--accent);
  }
  &.empty span {
    margin-left: 0;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--ink3);
    line-height: 1.6;
  }
}
.rkList {
  margin-top: 12px;
  border-top: 1px dashed var(--line);
  padding-top: 8px;
  div {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    font-size: 12.5px;
    color: var(--ink2);
  }
  em {
    font-style: normal;
    width: 16px;
    font-family: var(--font-serif);
    color: var(--ink3);
  }
  span {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  b {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: 400;
    color: var(--ink);
  }
}
.rkMore {
  margin-top: auto;
  padding-top: 10px;
  font-size: 12px;
  color: var(--ink3);
  cursor: pointer;
  &:hover {
    color: var(--main);
  }
}
.rkEmpty {
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
.rkState {
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
.rkTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
