<!-- 探索 · 目标罗盘
     首页告诉你「学什么」，这里告诉你「差什么」。
     选一个目标岗位 → 8 项能力逐条对照 → 点格子自评 → 缺口与补齐时长实时重算。
     这是探索页唯一「结果因人而异」的模块，也是首页永远给不出的东西。 -->
<template>
  <div class="sc">
    <div class="sc-roles">
      <button
        v-for="r in roles"
        :key="r.id"
        class="role"
        :class="{ on: r.id === roleId }"
        @click="pick(r.id)"
      >
        <span class="rn">{{ r.name }}</span>
        <span class="rs">{{ r.salary }}</span>
      </button>
    </div>

    <div class="sc-body">
      <div class="sc-list">
        <div class="sc-row" v-for="s in rows" :key="s.key">
          <div class="nm">
            <span class="t">{{ s.name }}</span>
            <span class="tip">{{ s.tip }}</span>
          </div>
          <div class="bars" :title="`目标 ${s.level} 档，当前 ${s.self} 档`">
            <i
              v-for="i in 5"
              :key="i"
              :class="{ fill: i <= s.self, need: i > s.self && i <= s.level }"
              @click="setSelf(s.key, i)"
            ></i>
          </div>
          <span class="st" :class="{ ok: s.self >= s.level, na: s.self === 0 }">
            {{ s.self >= s.level ? '已达标' : s.self === 0 ? '未开始' : `差 ${s.level - s.self} 档` }}
          </span>
        </div>
      </div>

      <aside class="sc-side">
        <div class="cap">当前目标</div>
        <div class="role-name">{{ current.name }}</div>
        <div class="role-sub">{{ current.sub }}</div>

        <div class="ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" class="track" />
            <circle
              cx="60" cy="60" r="50"
              class="prog"
              :style="{ strokeDashoffset: 314 - (314 * pct) / 100 }"
            />
          </svg>
          <div class="ring-txt">
            <b>{{ done }}</b><span>/{{ rows.length }}</span>
            <em>项达标</em>
          </div>
        </div>

        <div class="kpis">
          <div><b>{{ gapCount }}</b><span>项缺口</span></div>
          <div><b>{{ hours }}h</b><span>最短补齐</span></div>
        </div>

        <p class="note">点左侧格子可以自评，缺口会立刻重算。</p>

        <button class="cta" @click="planOpen = !planOpen">
          {{ planOpen ? '收起补齐顺序' : '看补齐顺序 →' }}
        </button>
      </aside>
    </div>

    <div class="sc-plan" v-if="planOpen">
      <div class="ph">按「补起来最快」排 —— 先吃掉短的那几项</div>
      <ol>
        <li v-for="(s, i) in plan" :key="s.key">
          <span class="no">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="pt">{{ s.name }}</span>
          <span class="ph2">{{ (s.gap / 60).toFixed(1) }} 小时</span>
          <span class="px">{{ s.tip }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ROLE_MODELS } from '@/mock/explore'

const props = defineProps({
  roles: { type: Array, default: () => ROLE_MODELS }
})

const roleId = ref(props.roles[0].id)
const planOpen = ref(false)
const KEY = 'zw_skill_self_v1'

// 自评存本地：{ 'java:mysql': 3, ... }
const selfMap = ref({})
try {
  selfMap.value = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
} catch {
  selfMap.value = {}
}

const current = computed(() => props.roles.find((r) => r.id === roleId.value) || props.roles[0])
const rows = computed(() =>
  current.value.skills.map((s) => ({
    ...s,
    self: selfMap.value[`${roleId.value}:${s.key}`] ?? s.self
  }))
)

const done = computed(() => rows.value.filter((s) => s.self >= s.level).length)
const gapCount = computed(() => rows.value.filter((s) => s.self < s.level).length)
const pct = computed(() => Math.round((done.value / rows.value.length) * 100))
// 缺口时长按「还差几档」折算，不是直接给满额
const hours = computed(() => {
  const m = rows.value.reduce((sum, s) => {
    if (s.self >= s.level) return sum
    return sum + (s.gap * (s.level - s.self)) / 5
  }, 0)
  return Math.round(m / 60)
})
const plan = computed(() =>
  [...rows.value].filter((s) => s.self < s.level).sort((a, b) => a.gap - b.gap)
)

const pick = (id) => {
  roleId.value = id
  planOpen.value = false
}

const setSelf = (key, v) => {
  const k = `${roleId.value}:${key}`
  const row = rows.value.find((r) => r.key === key)
  // 再点同一格 = 退回上一档，避免点错了没法改
  const next = row && row.self === v ? v - 1 : v
  selfMap.value = { ...selfMap.value, [k]: Math.max(0, next) }
  try {
    localStorage.setItem(KEY, JSON.stringify(selfMap.value))
  } catch {
    /* localStorage 不可用时只影响持久化 */
  }
}

watch(roleId, () => (planOpen.value = false))
</script>

<style lang="scss" scoped>
.sc {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 20px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sc-roles {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);

  .role {
    display: flex;
    align-items: baseline;
    gap: 6px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    padding: 6px 13px;
    cursor: pointer;
    transition: 0.18s var(--ease-out);
    font-family: inherit;

    .rn {
      font-size: 13px;
      color: var(--ink2);
    }

    .rs {
      font-size: 11px;
      color: var(--ink3);
    }

    &:hover {
      background: var(--paper);
    }

    &.on {
      background: var(--main);
      border-color: var(--main);

      .rn {
        color: #fff;
        font-weight: 500;
      }

      .rs {
        color: rgba(255, 255, 255, 0.66);
      }
    }
  }
}

.sc-body {
  display: grid;
  grid-template-columns: 1fr 232px;
  gap: 24px;
  padding-top: 16px;
  flex: 1;
}

.sc-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sc-row {
  display: grid;
  grid-template-columns: 1fr auto 62px;
  align-items: center;
  gap: 16px;
  padding: 7px 0;

  & + .sc-row {
    border-top: 1px dashed rgba(230, 224, 211, 0.7);
  }

  .nm {
    min-width: 0;

    .t {
      display: block;
      font-size: 13.5px;
      color: var(--ink);
      line-height: 1.4;
    }

    .tip {
      display: block;
      font-size: 11.5px;
      color: var(--ink3);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .bars {
    display: flex;
    gap: 3px;

    i {
      width: 22px;
      height: 7px;
      border-radius: 2px;
      background: var(--paper2);
      cursor: pointer;
      transition: 0.16s var(--ease-out);

      &:hover {
        background: var(--line-strong);
      }

      &.need {
        background: var(--main-soft);
      }

      &.fill {
        background: var(--main);
      }
    }
  }

  .st {
    font-size: 11.5px;
    color: var(--ink3);
    text-align: right;
    white-space: nowrap;

    &.ok {
      color: var(--free);
    }

    &.na {
      color: var(--ink3);
    }
  }
}

.sc-side {
  border-left: 1px solid var(--line);
  padding-left: 22px;
  display: flex;
  flex-direction: column;

  .cap {
    font-size: 11px;
    color: var(--ink3);
    letter-spacing: 0.4px;
  }

  .role-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    margin-top: 4px;
  }

  .role-sub {
    font-size: 11.5px;
    color: var(--ink3);
    margin-top: 3px;
  }

  .ring {
    position: relative;
    width: 132px;
    height: 132px;
    margin: 10px auto 6px;

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .track {
      fill: none;
      stroke: var(--paper2);
      stroke-width: 8;
    }

    .prog {
      fill: none;
      stroke: var(--main);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 314;
      transition: stroke-dashoffset 0.5s var(--ease-out);
    }

    .ring-txt {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      align-content: center;
      gap: 0 2px;

      b {
        font-size: 27px;
        font-weight: 600;
        color: var(--ink);
        font-variant-numeric: lining-nums;
      }

      span {
        font-size: 13px;
        color: var(--ink3);
        align-self: flex-end;
        margin-bottom: 6px;
      }

      em {
        width: 100%;
        text-align: center;
        font-size: 11px;
        color: var(--ink3);
        font-style: normal;
        margin-top: 1px;
      }
    }
  }

  .kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    text-align: center;

    div {
      background: var(--paper);
      border-radius: var(--radius-md);
      padding: 8px 4px;
    }

    b {
      display: block;
      font-size: 16px;
      color: var(--ink);
      font-variant-numeric: lining-nums;
    }

    span {
      font-size: 11px;
      color: var(--ink3);
    }
  }

  .note {
    font-size: 11px;
    color: var(--ink3);
    line-height: 1.5;
    margin: 10px 0 10px;
  }

  .cta {
    margin-top: auto;
    width: 100%;
    background: var(--main);
    color: #fff;
    border: 0;
    border-radius: var(--radius-md);
    padding: 9px 0;
    font-size: 12.5px;
    font-family: inherit;
    cursor: pointer;
    transition: 0.18s;

    &:hover {
      background: var(--main-deep);
    }
  }
}

.sc-plan {
  margin-top: 16px;
  border-top: 1px solid var(--line);
  padding-top: 13px;

  .ph {
    font-size: 11.5px;
    color: var(--ink3);
    margin-bottom: 8px;
  }

  ol {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 24px;
  }

  li {
    display: grid;
    grid-template-columns: 22px 1fr auto;
    gap: 8px;
    align-items: baseline;
    padding: 5px 0;
    font-size: 12.5px;

    .no {
      color: var(--main);
      font-variant-numeric: lining-nums;
      font-size: 11px;
    }

    .pt {
      color: var(--ink);
    }

    .ph2 {
      color: var(--ink3);
      font-size: 11.5px;
    }

    .px {
      grid-column: 2 / -1;
      font-size: 11px;
      color: var(--ink3);
      line-height: 1.5;
    }
  }
}
</style>
