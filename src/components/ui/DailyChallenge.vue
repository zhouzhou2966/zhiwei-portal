<!-- 探索 · 今日挑战
     三题一组，选完立刻判、立刻讲为什么。首页没有「动手」的地方，这里补上一个。
     题目从 QUIZ_BANK 抽，连对记录存本地。 -->
<template>
  <div class="dc">
    <div class="dc-head">
      <div>
        <div class="tag">今日挑战</div>
        <div class="sub">3 题 · 约 2 分钟 · 每题都有解析</div>
      </div>
      <div class="streak" v-if="streak > 0">
        <b>{{ streak }}</b><span>天连对</span>
      </div>
    </div>

    <!-- 未开始 -->
    <div class="dc-idle" v-if="stage === 'idle'">
      <div class="cover">
        <span class="q1">?</span><span class="q2">?</span><span class="q3">?</span>
      </div>
      <p>不考记忆，考判断。<br />答错不要紧，解析会告诉你差在哪一行。</p>
      <button class="btn" @click="start">开始这组 →</button>
    </div>

    <!-- 答题中 -->
    <div class="dc-quiz" v-else-if="stage === 'quiz'">
      <div class="prog">
        <span
          v-for="(q, i) in set"
          :key="q.id"
          :class="{ on: i === idx, pass: i < idx }"
        ></span>
        <span class="tm">{{ elapsed }}s</span>
      </div>

      <div class="qtag">{{ cur.tag }}</div>
      <div class="qtext">{{ cur.q }}</div>

      <div class="opts">
        <div
          v-for="(o, i) in cur.options"
          :key="i"
          class="opt"
          :class="optClass(i)"
          @click="choose(i)"
        >
          <span class="key">{{ 'ABCD'[i] }}</span>
          <span class="ot">{{ o }}</span>
        </div>
      </div>

      <transition name="fade">
        <div class="fb" v-if="picked !== null">
          <div class="fh" :class="picked === cur.answer ? 'ok' : 'no'">
            {{ picked === cur.answer ? '答对了' : '差一点' }}
          </div>
          <p>{{ cur.explain }}</p>
          <button class="btn small" @click="next">
            {{ idx === set.length - 1 ? '看结果 →' : '下一题 →' }}
          </button>
        </div>
      </transition>
    </div>

    <!-- 结果 -->
    <div class="dc-done" v-else>
      <div class="score">
        <b>{{ right }}</b><span>/ {{ set.length }}</span>
      </div>
      <div class="verdict">{{ verdict }}</div>
      <div class="meta">用时 {{ elapsed }} 秒 · 本组覆盖 {{ tags.join(' / ') }}</div>
      <div class="done-list">
        <div
          v-for="(q, i) in set"
          :key="q.id"
          class="dl"
          :class="{ ok: answers[i] === q.answer }"
        >
          <span class="dmark">{{ answers[i] === q.answer ? '✓' : '✕' }}</span>
          <span class="dt">{{ q.tag }}</span>
          <span class="dd">{{ q.explain }}</span>
        </div>
      </div>
      <button class="btn small" @click="start">再来一组 →</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { QUIZ_BANK } from '@/mock/explore'

const stage = ref('idle')
const set = ref([])
const idx = ref(0)
const picked = ref(null)
const answers = ref([])
const seconds = ref(0)
const streak = ref(0)
let timer = null

const cur = computed(() => set.value[idx.value] || {})
const right = computed(() => answers.value.filter((a, i) => a === set.value[i].answer).length)
const tags = computed(() => [...new Set(set.value.map((q) => q.tag))])
const elapsed = computed(() => (stage.value === 'quiz' ? seconds.value : seconds.value))

try {
  streak.value = Number(localStorage.getItem('zw_quiz_streak') || 0)
} catch {
  streak.value = 0
}

const verdict = computed(() => {
  const r = right.value
  if (r === set.value.length) return '全对。这组的三个点你都能讲清楚，可以跳着学了。'
  if (r >= 2) return '底子不错。错的那题建议顺手把解析里的反例记下来。'
  if (r >= 1) return '对了一题。多半是概念边界模糊，不是没学过。'
  return '三题都没对，说明这几个点还停在「听懂了」。挑一题，自己讲一遍试试。'
})

// 抽题：优先没连续出现过的，简单做法是打乱后取前 3
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const start = () => {
  set.value = shuffle(QUIZ_BANK).slice(0, 3)
  idx.value = 0
  picked.value = null
  answers.value = []
  seconds.value = 0
  stage.value = 'quiz'
  clearInterval(timer)
  timer = setInterval(() => seconds.value++, 1000)
}

const choose = (i) => {
  if (picked.value !== null) return
  picked.value = i
  answers.value = [...answers.value, i]
}

const optClass = (i) => {
  if (picked.value === null) return ''
  if (i === cur.value.answer) return 'right'
  if (i === picked.value) return 'wrong'
  return 'dim'
}

const next = () => {
  if (idx.value === set.value.length - 1) {
    clearInterval(timer)
    stage.value = 'done'
    const allRight = answers.value.every((a, i) => a === set.value[i].answer)
    streak.value = allRight ? streak.value + 1 : 0
    try {
      localStorage.setItem('zw_quiz_streak', String(streak.value))
    } catch {
      /* 忽略 */
    }
    return
  }
  idx.value++
  picked.value = null
}

onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.dc {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 20px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dc-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);

  .tag {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }

  .sub {
    font-size: 11.5px;
    color: var(--ink3);
    margin-top: 4px;
  }

  .streak {
    text-align: right;

    b {
      font-size: 20px;
      color: var(--accent);
      font-variant-numeric: lining-nums;
    }

    span {
      font-size: 10.5px;
      color: var(--ink3);
      display: block;
    }
  }
}

.btn {
  background: var(--main);
  color: #fff;
  border: 0;
  border-radius: var(--radius-md);
  padding: 9px 18px;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: 0.18s;

  &:hover {
    background: var(--main-deep);
  }

  &.small {
    padding: 7px 15px;
    font-size: 12px;
  }
}

/* 未开始 */
.dc-idle {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 10px 0;

  .cover {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;

    span {
      width: 38px;
      height: 46px;
      border-radius: 8px;
      background: var(--paper);
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-serif);
      font-size: 22px;
      color: var(--ink3);
    }

    .q1 {
      transform: rotate(-6deg);
    }

    .q2 {
      transform: translateY(-5px);
      color: var(--main);
      border-color: var(--main-soft);
      background: var(--main-soft);
    }

    .q3 {
      transform: rotate(6deg);
    }
  }

  p {
    font-size: 12.5px;
    color: var(--ink2);
    line-height: 1.75;
    margin-bottom: 20px;
  }
}

/* 答题中 */
.dc-quiz {
  flex: 1;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
}

.prog {
  display: flex;
  align-items: center;
  gap: 5px;

  span {
    width: 26px;
    height: 3px;
    border-radius: 2px;
    background: var(--paper2);

    &.on {
      background: var(--main);
    }

    &.pass {
      background: var(--main-soft);
    }
  }

  .tm {
    margin-left: auto;
    width: auto;
    height: auto;
    background: none;
    font-size: 11px;
    color: var(--ink3);
    font-variant-numeric: lining-nums;
  }
}

.qtag {
  display: inline-block;
  align-self: flex-start;
  font-size: 10.5px;
  color: var(--main);
  background: var(--main-soft);
  border-radius: 4px;
  padding: 2px 6px;
  margin-top: 13px;
}

.qtext {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink);
  margin: 9px 0 13px;
  font-weight: 500;
}

.opts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.opt {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 9px 10px;
  cursor: pointer;
  transition: 0.16s var(--ease-out);

  .key {
    flex: none;
    width: 17px;
    height: 17px;
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink3);
    font-size: 10.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .ot {
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--ink2);
  }

  &:hover {
    border-color: var(--line-strong);
    background: var(--paper);
  }

  &.right {
    border-color: var(--free);
    background: rgba(46, 125, 111, 0.06);

    .key {
      background: var(--free);
      color: #fff;
    }

    .ot {
      color: var(--ink);
    }
  }

  &.wrong {
    border-color: #c0563f;
    background: rgba(192, 86, 63, 0.06);

    .key {
      background: #c0563f;
      color: #fff;
    }

    .ot {
      color: var(--ink);
    }
  }

  &.dim {
    opacity: 0.5;
  }
}

.fb {
  margin-top: 12px;
  background: var(--paper);
  border-radius: var(--radius-md);
  padding: 11px 12px 12px;

  .fh {
    font-size: 11.5px;
    font-weight: 600;
    margin-bottom: 5px;

    &.ok {
      color: var(--free);
    }

    &.no {
      color: #c0563f;
    }
  }

  p {
    font-size: 11.5px;
    line-height: 1.7;
    color: var(--ink2);
    margin-bottom: 10px;
  }
}

.fade-enter-active {
  transition: 0.22s var(--ease-out);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

/* 结果 */
.dc-done {
  flex: 1;
  padding-top: 16px;
  display: flex;
  flex-direction: column;

  .score {
    text-align: center;

    b {
      font-size: 40px;
      font-weight: 600;
      color: var(--main);
      font-variant-numeric: lining-nums;
      line-height: 1;
    }

    span {
      font-size: 15px;
      color: var(--ink3);
      margin-left: 3px;
    }
  }

  .verdict {
    font-size: 12.5px;
    color: var(--ink2);
    line-height: 1.7;
    text-align: center;
    margin: 10px 6px 4px;
  }

  .meta {
    font-size: 11px;
    color: var(--ink3);
    text-align: center;
    margin-bottom: 12px;
  }

  .done-list {
    flex: 1;
    overflow: auto;
    margin-bottom: 12px;

    .dl {
      display: grid;
      grid-template-columns: 14px 62px 1fr;
      gap: 6px;
      padding: 6px 0;
      border-top: 1px dashed var(--line);
      font-size: 11px;
      line-height: 1.55;

      .dmark {
        color: #c0563f;
      }

      .dt {
        color: var(--ink2);
      }

      .dd {
        color: var(--ink3);
      }

      &.ok .dmark {
        color: var(--free);
      }
    }
  }

  .btn {
    align-self: center;
  }
}
</style>
