<!-- 首页首屏 · 继续学习卡

     为什么首页第一屏不再是轮播：
     用户回到平台，第一个问题永远是「我上次学到哪了」，而不是「你们在卖什么」。
     轮播挪到右侧活动位，这块位置留给账号里唯一一件有时效性的事 —— 进度。

     三种状态都要画，不能只画登录且有课的那一种：
     ① 有在学课程 → 封面 + 上次学到第几节 + 进度条 + 继续学习
     ② 已登录但没有课 → 引导去选课（不留一张空卡）
     ③ 未登录 → 说明「登录后能同步进度」，避免游客看到一屏残缺信息 -->
<template>
  <section class="workHero">
    <div class="spot" aria-hidden="true"></div>

    <header class="heroHead">
      <span class="greet">{{ greetText }}<template v-if="userName">，{{ userName }}</template></span>
      <span class="sub" v-if="lesson && lesson.courseAmount">在学 {{ lesson.courseAmount }} 门</span>
    </header>

    <!-- ① 有在学课程 -->
    <div class="heroBody" v-if="lesson">
      <div class="cover" @click="goLearn">
        <img v-if="lesson.courseCoverUrl" :src="lesson.courseCoverUrl" :alt="lesson.courseName" />
        <span v-else class="coverTxt">{{ (lesson.courseName || '课').slice(0, 1) }}</span>
      </div>

      <div class="info">
        <span class="kicker">{{ learnLabel }}</span>
        <h2 class="name" :title="lesson.courseName" @click="goLearn">{{ lesson.courseName }}</h2>
        <p class="last" v-if="lesson.latestSectionName">
          第 {{ lesson.latestSectionIndex }} 节 · {{ lesson.latestSectionName }}
        </p>
        <p class="last" v-else>还没有学习记录，从第一节开始</p>
        <p class="count">已学 {{ learned }} / {{ lesson.sections || 0 }} 节</p>
      </div>

      <!-- 进度环放在按钮左边：原来这里的进度条是横向细线，右侧整块是空的，
           改成环之后「还剩多少」用一个形状说清楚，也把卡片右半部分撑起来 -->
      <div class="ring">
        <svg viewBox="0 0 76 76" width="76" height="76">
          <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6" />
          <circle
            cx="38" cy="38" r="32" fill="none"
            stroke="#EBCB84" stroke-width="6" stroke-linecap="round"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 38 38)"
          />
        </svg>
        <span class="ringTxt">{{ percent }}<i>%</i></span>
      </div>

      <button class="cta" type="button" @click="goLearn">继续学习</button>
    </div>

    <!-- ② 已登录但一门课都没有：拿一门真实课程当「第一步」，比一句「去选课」有用 -->
    <div class="heroBody" v-else-if="logged && pick">
      <div class="cover" @click="goPick">
        <img v-if="pick.coverUrl" :src="pick.coverUrl" :alt="pick.name" />
        <span v-else class="coverTxt">{{ (pick.name || '课').slice(0, 1) }}</span>
      </div>

      <div class="info">
        <span class="kicker">从这里开始</span>
        <h2 class="name" :title="pick.name" @click="goPick">{{ pick.name }}</h2>
        <p class="last">{{ pick.teacher || '匿名讲师' }} · {{ pick.sections || 0 }} 节 · {{ pick.sold || 0 }} 人在学</p>
        <p class="hint">还没有在学课程，先免费把这门学完</p>
      </div>

      <!-- 没课时没有进度可画，用一个「免费」印章占住进度环的位置，
           避免按钮孤零零飘在最右边 -->
      <div class="seal">
        <b>免费</b>
        <i>0 元</i>
      </div>

      <button class="cta" type="button" @click="goPick">去看看</button>
    </div>

    <!-- ③ 已登录、连推荐课程都没拿到 -->
    <div class="heroEmpty" v-else-if="logged">
      <h2 class="name">还没有开始学习</h2>
      <p class="last">从免费好课开始，先把第一门课学完</p>
      <button class="cta" type="button" @click="goSearch">去选课</button>
    </div>

    <!-- ③ 游客 -->
    <div class="heroEmpty" v-else>
      <h2 class="name">登录后，这里会记住你学到哪</h2>
      <p class="last">进度、学习计划、积分都会自动同步</p>
      <button class="cta" type="button" @click="goLogin">登录 / 注册</button>
    </div>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  // 登录态：游客时课程接口本来也不返回数据，这里显式区分是为了换文案
  logged: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  // /ls/lessons/now 的 data，没有在学课程时为 null
  lesson: { type: Object, default: null },
  // 没在学课程时用来「起个头」的推荐课（首页取免费好课的第一门）
  suggest: { type: Object, default: null }
})

const router = useRouter()

/**
 * 问候语按小时切，不按「上午/下午」这种粗粒度：
 * 19 点还说「下午好」是最容易让人觉得机器人的地方。
 */
const greetText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 与「我的课程」页口径一致：status=2 是已学完，用「最后学习」而不是「正在学习」
const learnLabel = computed(() =>
  Number(props.lesson && props.lesson.status) === 2 ? '继续复习' : '继续学习'
)

/**
 * 已学节数要夹在总节数内。
 * 后端 learnedSections 是学习记录条数，课程改过大纲后会大于 sections，
 * 不夹的话进度会算出 180%，进度条直接溢出卡外（我的课程页踩过同一个坑）。
 */
const learned = computed(() => {
  const total = Number(props.lesson && props.lesson.sections) || 0
  const done = Number(props.lesson && props.lesson.learnedSections) || 0
  return total > 0 ? Math.min(done, total) : done
})

const percent = computed(() => {
  const total = Number(props.lesson && props.lesson.sections) || 0
  if (!total) return 0
  return Math.min(100, Math.round((learned.value / total) * 100))
})

// 半径 32 的周长：进度环靠 stroke-dashoffset 控制显示比例
const CIRC = 2 * Math.PI * 32
const dashOffset = computed(() => CIRC * (1 - percent.value / 100))

const goLearn = () => {
  const id = props.lesson && props.lesson.courseId
  if (!id) return
  router.push({ path: '/learning/index', query: { id } })
}
const goSearch = () => router.push('/search/index')
const goLogin = () => router.push('/login')

// 推荐课只在「登录了但没课」时用；有在学课程时它不参与渲染
const pick = computed(() => props.lesson ? null : props.suggest)
const goPick = () => {
  if (!pick.value || !pick.value.id) return
  router.push({ path: '/details', query: { id: pick.value.id } })
}
</script>
<style lang="scss" scoped>
.workHero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 244px;
  padding: 22px 26px 24px;
  border-radius: 18px;
  color: #fff;
  /* 深蓝底 + 右上角一点暖金光。用绝对定位的光斑而不是第二个渐变：
     光斑要跟着卡片尺寸走，background-size 在不同宽度下会变形 */
  background: linear-gradient(158deg, #0E2C3F 0%, #12374F 62%, #16405B 100%);
}

/* 装饰光斑：不拦点击，也不参与布局 */
.spot {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 164, 65, .22) 0%, rgba(217, 164, 65, 0) 68%);
  pointer-events: none;
}

.heroHead {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.greet {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: .3px;
  color: rgba(255, 255, 255, .92);
}

.sub {
  font-size: 12px;
  color: rgba(255, 255, 255, .52);
}

.heroBody {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 168px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, .08);
  box-shadow: 0 8px 20px rgba(0, 0, 0, .22);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .4s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.coverTxt {
  font-size: 30px;
  font-weight: 500;
  color: rgba(255, 255, 255, .3);
}

.info {
  flex: 1;
  min-width: 0;
}

.kicker {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 1.4px;
  color: #EBCB84;
}

.name {
  margin-top: 5px;
  font-size: 19px;
  font-weight: 600;
  line-height: 26px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    color: #EBCB84;
  }
}

.last {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, .58);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 推荐课那条「还没有在学课程」的说明：比 .last 更弱，避免和课程信息抢层级 */
.hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, .4);
}

/* 已学节数：进度信息从进度条挪成一行文字，环形负责「比例」，文字负责「具体数字」 */
.count {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, .46);
}

.ring {
  position: relative;
  flex: none;
  margin: 0 6px 0 4px;
}

.ringTxt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 27px;
  font-size: 18px;
  font-weight: 600;
  color: #EBCB84;

  i {
    margin-left: 1px;
    font-style: normal;
    font-size: 10px;
    font-weight: 400;
    color: rgba(255, 255, 255, .5);
  }
}

/* 没课时的「免费」印章：直径和进度环一致，站位也一致 */
.seal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 76px;
  height: 76px;
  margin: 0 6px 0 4px;
  border: 1px dashed rgba(235, 203, 132, .55);
  border-radius: 50%;

  b {
    font-size: 17px;
    font-weight: 600;
    color: #EBCB84;
  }

  i {
    margin-top: 2px;
    font-style: normal;
    font-size: 10px;
    color: rgba(255, 255, 255, .45);
  }
}

.cta {
  flex: none;
  align-self: flex-end;
  padding: 0 22px;
  height: 38px;
  font-size: 14px;
  font-weight: 500;
  color: #12374F;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #EBCB84, #D9A441);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(217, 164, 65, .32);
  }

  &:active {
    transform: translateY(0);
  }
}

/* ②③ 空态：垂直居中，不要留一张下半截是空的卡 */
.heroEmpty {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
  gap: 8px;
  padding-bottom: 8px;

  .name {
    margin-top: 0;
    cursor: default;

    &:hover {
      color: #fff;
    }
  }

  .cta {
    align-self: flex-start;
    margin-top: 8px;
  }
}
</style>
