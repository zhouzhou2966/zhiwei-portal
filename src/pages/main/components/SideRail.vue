<!-- 首页右栏

     它存在的意义是给页面一个「第二层信息」：
     原来所有东西都挤在同一条纵轴上，只能靠不停往下堆同款课程块来填，
     越填越像货架。把账号级、社区级的信息收到右侧固定宽度，左侧主区才能专注讲课程。

     四块内容按「每分钟会变一次 → 一天变一次 → 一周变一次」排序：
     活动位 / 本周进度 / 天梯榜 / 讨论。越靠上越需要立刻看到。 -->
<template>
  <aside class="sideRail">
    <!-- ① 活动位：轮播从首屏主角降级成右栏的一张卡，
         它不再是页面的第一印象，但仍保留了运营位该有的位置 -->
    <div class="sideBlock banner" v-if="banners.length">
      <Swiper :data="banners" />
    </div>

    <!-- ② 游客：账号数据一条都没有，与其摆一排「-」，不如说清楚登录能得到什么 -->
    <div class="sideBlock guest" v-if="!logged">
      <p class="gTitle">登录后能看到</p>
      <div class="gRow" v-for="g in guestPoints" :key="g">
        <i class="gDot"></i>
        <span>{{ g }}</span>
      </div>
      <button class="gBtn" type="button" @click="$router.push('/login')">登录 / 注册</button>
    </div>

    <!-- ③ 本周进度：环形 + 三个数字。
         环只有一个，所以只讲一件事 ——「本周学了几节」，其余用文字排 -->
    <div class="sideBlock week" v-if="logged">
      <header class="blkHead">
        <span class="blkTitle">本周学习</span>
        <span class="blkMore" @click="$router.push('/personal/main/myClass')">我的课程<i class="arr"></i></span>
      </header>

      <div class="weekBody">
        <div class="ring">
          <svg viewBox="0 0 72 72" width="72" height="72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#F0EBE1" stroke-width="7" />
            <circle
              cx="36" cy="36" r="30" fill="none"
              stroke="url(#weekGrad)" stroke-width="7" stroke-linecap="round"
              :stroke-dasharray="CIRC"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 36 36)"
            />
            <defs>
              <linearGradient id="weekGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#EBCB84" />
                <stop offset="100%" stop-color="#D9A441" />
              </linearGradient>
            </defs>
          </svg>
          <div class="ringTxt">
            <b v-if="week.ready">{{ week.done }}</b>
            <b v-else>-</b>
            <span>节</span>
          </div>
        </div>

        <div class="weekNums">
          <div class="numRow">
            <span class="k">目标</span>
            <span class="v">{{ week.ready ? week.total : '-' }}<i>节</i></span>
          </div>
          <div class="numRow">
            <span class="k">本周积分</span>
            <span class="v hl">{{ week.ready ? week.points : '-' }}</span>
          </div>
        </div>
      </div>

      <p class="weekTip" v-if="week.ready">
        {{ weekTip }}
      </p>
    </div>

    <!-- ④ 天梯榜：只放前 5 名 + 我的名次。
         完整榜单在个人中心，首页给的是「我大概在什么位置」 -->
    <div class="sideBlock rank" v-if="logged && rank.list.length">
      <header class="blkHead">
        <span class="blkTitle">学霸天梯榜</span>
        <span class="blkMore" @click="$router.push('/account/main/myIntegralRanking')">完整榜单<i class="arr"></i></span>
      </header>

      <div class="rankRow" v-for="(item, i) in rank.list.slice(0, 5)" :key="i">
        <span class="medal" :class="`m${i + 1}`">{{ i + 1 }}</span>
        <span class="rankName">{{ item.name || '匿名同学' }}</span>
        <span class="rankPts">{{ item.points }}</span>
      </div>

      <!-- 我自己不在前 5 时单独补一行，否则榜单对用户没有「关我什么事」 -->
      <div class="rankRow me" v-if="rank.myRank && rank.myRank > 5">
        <span class="medal meMedal">{{ rank.myRank }}</span>
        <span class="rankName">我</span>
        <span class="rankPts">{{ rank.myPoints }}</span>
      </div>
    </div>

    <!-- ⑤ 讨论：社区里正在聊的话题。
         走的是站内已有的问答区，不发新接口，只是把入口从二级页提到首页 -->
    <div class="sideBlock talk">
      <header class="blkHead">
        <span class="blkTitle">大家在看什么</span>
        <span class="blkMore" @click="$router.push('/ask/index')">更多讨论<i class="arr"></i></span>
      </header>

      <div class="talkItem" v-for="(t, i) in topics" :key="i" @click="$router.push('/ask/index')">
        <span class="talkTag">{{ t.tag }}</span>
        <p class="talkTitle">{{ t.title }}</p>
        <span class="talkMeta">{{ t.replies }} 条讨论</span>
      </div>
    </div>
  </aside>
</template>
<script setup>
import { computed } from 'vue'
import Swiper from './Swiper.vue'

const props = defineProps({
  logged: { type: Boolean, default: false },
  banners: { type: Array, default: () => [] },
  // { ready, done, total, points }
  week: { type: Object, default: () => ({}) },
  // { list: [{name, points}], myRank, myPoints }
  rank: { type: Object, default: () => ({ list: [] }) },
  topics: { type: Array, default: () => [] }
})

// 游客引导只讲三件账号里才会有的事，不铺垫平台介绍
const guestPoints = ['每门课学到第几节都会记下来', '参与学霸天梯榜，看自己排第几', '每日签到攒积分']

// 半径 30 的圆周长：进度环用 stroke-dasharray 控制显示比例
const CIRC = 2 * Math.PI * 30

const dashOffset = computed(() => {
  const total = Number(props.week.total) || 0
  const done = Number(props.week.done) || 0
  if (!total) return CIRC
  // 超额完成（done > total）按满环画，不要出现负偏移把环画反
  const ratio = Math.min(1, done / total)
  return CIRC * (1 - ratio)
})

// 一句人话总结，比让用户自己算「3 / 7 意味着什么」友好
const weekTip = computed(() => {
  const total = Number(props.week.total) || 0
  const done = Number(props.week.done) || 0
  if (!total) return '还没有设置本周学习目标'
  const left = total - done
  if (left <= 0) return '本周目标已完成，超额的学习都会算进积分'
  return `再学 ${left} 节就完成本周目标`
})
</script>
<style lang="scss" scoped>
.sideRail {
  /* 主区比右栏长得多（课程区一直往下铺），右栏如果跟着文档走，
     滚到精品新课那一屏时右侧就是一片空白。
     sticky 让它在视口内停住，滚动过程中始终有信息在右边。 */
  position: sticky;
  top: 16px;
  width: 320px;
  flex: none;
}

.sideBlock {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #EDE7DB;
  border-radius: 14px;
}

/* 活动位不要内边距，图要贴边 */
.banner {
  padding: 0;
  height: 156px;
  overflow: hidden;

  :deep(.swiperWrapper) {
    border-radius: 14px;
  }

  /* Banner 原图 1080×430（2.51:1），这里 320×156（2.05:1），cover 下左右各裁 9%。
     文案都靠左，所以描点压到左边，裁掉的是右侧的装饰图形 */
  :deep(img) {
    object-position: left center;
  }
}

.blkHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.blkTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-font1);
}

.blkMore {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-font3);
  cursor: pointer;
  transition: color .18s;

  &:hover {
    color: var(--color-main);
  }
}

.arr {
  width: 4px;
  height: 4px;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}

/* ===== 游客引导 ===== */
.guest {
  padding: 18px;
  background: linear-gradient(180deg, #FFFDF8, #FFF);
  border-color: #EFE4CC;
}

.gTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-font1);
}

.gRow {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-font2);
}

.gDot {
  width: 5px;
  height: 5px;
  margin-top: 6px;
  flex: none;
  border-radius: 50%;
  background: #D9A441;
}

.gBtn {
  width: 100%;
  height: 36px;
  margin-top: 16px;
  font-size: 13px;
  color: #12374F;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #EBCB84, #D9A441);
  cursor: pointer;
  transition: transform .18s;

  &:hover {
    transform: translateY(-1px);
  }
}

/* ===== 本周 ===== */
.weekBody {
  display: flex;
  align-items: center;
  gap: 18px;
}

.ring {
  position: relative;
  flex: none;

  svg {
    display: block;
  }
}

.ringTxt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 24px;

  b {
    font-size: 22px;
    font-weight: 600;
    line-height: 1;
    color: var(--color-font1);
  }

  span {
    margin-left: 2px;
    font-size: 11px;
    color: var(--color-font3);
  }
}

.weekNums {
  flex: 1;
  min-width: 0;
}

.numRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 5px 0;

  & + .numRow {
    border-top: 1px dashed #F0EBE1;
  }
}

.k {
  font-size: 12px;
  color: var(--color-font3);
}

.v {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-font1);

  i {
    margin-left: 2px;
    font-style: normal;
    font-size: 11px;
    font-weight: 400;
    color: var(--color-font3);
  }

  &.hl {
    color: #B07D1E;
  }
}

.weekTip {
  margin-top: 12px;
  padding-top: 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--color-font3);
  border-top: 1px dashed #F0EBE1;
}

/* ===== 榜单 ===== */
.rankRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;

  & + .rankRow {
    border-top: 1px solid #F7F3EB;
  }

  &.me {
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px dashed #E7DECB;
  }
}

.medal {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-font3);
  border-radius: 50%;
  background: #F5F1E8;

  &.m1 {
    color: #6B4A0C;
    background: linear-gradient(135deg, #F2DC9C, #D9A441);
  }

  &.m2 {
    color: #4A5560;
    background: linear-gradient(135deg, #EDF1F4, #B9C3CB);
  }

  &.m3 {
    color: #6B4324;
    background: linear-gradient(135deg, #EDCBA9, #C08A5A);
  }

  &.meMedal {
    color: var(--color-main);
    background: var(--color-main-light);
  }
}

.rankName {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--color-font2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rankPts {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-font1);
}

/* ===== 讨论 ===== */
.talkItem {
  padding: 9px 0;
  cursor: pointer;

  & + .talkItem {
    border-top: 1px solid #F7F3EB;
  }

  &:hover .talkTitle {
    color: var(--color-main);
  }
}

.talkTag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  color: #2E7D6F;
  border-radius: 3px;
  background: #E8F4F1;
}

.talkTitle {
  margin-top: 5px;
  font-size: 13px;
  line-height: 19px;
  color: var(--color-font1);
  transition: color .18s;
  /* 两行截断：标题长短不一，放开会把右栏节奏拉散 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.talkMeta {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-font3);
}
</style>
