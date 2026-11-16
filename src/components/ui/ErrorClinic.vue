<!-- 探索 · 报错诊所
     粘一段报错，看别人是怎么走出来的。
     这一块的价值不在「内容多」，而在命中：报错原文 → 病根 → 三步解法。
     首页永远不会有这种形态 —— 它不是给人消费的，是给人用的。 -->
<template>
  <div class="ec">
    <div class="ec-top">
      <div class="ec-search">
        <span class="ico">⌕</span>
        <input
          v-model="kw"
          type="text"
          placeholder="粘贴一段报错，或搜「空指针 / 504 / 死锁」…"
          spellcheck="false"
        />
        <span class="clr" v-if="kw" @click="kw = ''">✕</span>
      </div>
      <div class="ec-tags">
        <span class="lb">高频</span>
        <span
          v-for="t in hotTags"
          :key="t"
          class="tg"
          :class="{ on: kw === t }"
          @click="kw = kw === t ? '' : t"
        >{{ t }}</span>
      </div>
    </div>

    <div class="ec-body">
      <div class="ec-list">
        <div
          v-for="c in list"
          :key="c.id"
          class="case"
          :class="{ on: c.id === activeId }"
          @click="activeId = c.id"
        >
          <div class="ch">
            <span class="lang">{{ c.lang }}</span>
            <span class="hits">{{ c.hits }} 人查过</span>
          </div>
          <div class="err">{{ c.error }}</div>
          <div class="sym">{{ c.symptom }}</div>
        </div>
        <div class="empty" v-if="!list.length">
          没匹配到。<br />试试只粘报错里的那一句关键描述，比如「NullPointerException」。
        </div>
      </div>

      <div class="ec-detail" v-if="active">
        <div class="dhead">
          <span class="dlang">{{ active.lang }}</span>
          <span class="dtag">{{ active.tag }}</span>
        </div>
        <pre class="dcode">{{ active.error }}</pre>

        <div class="dsec">
          <div class="dt">你看到的</div>
          <p>{{ active.symptom }}</p>
        </div>
        <div class="dsec">
          <div class="dt cause">病根</div>
          <p>{{ active.cause }}</p>
        </div>
        <div class="dsec">
          <div class="dt fix">三步走出来</div>
          <ol>
            <li v-for="(s, i) in active.steps" :key="i">
              <span class="n">{{ i + 1 }}</span>
              <span>{{ s }}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ERROR_CASES } from '@/mock/explore'

const kw = ref('')
const activeId = ref('')

const hotTags = computed(() => [...new Set(ERROR_CASES.map((c) => c.tag))].slice(0, 6))

const list = computed(() => {
  const k = kw.value.trim().toLowerCase()
  const base = [...ERROR_CASES].sort((a, b) => b.hits - a.hits)
  if (!k) return base.slice(0, 6)
  return base.filter((c) =>
    [c.error, c.symptom, c.cause, c.tag, c.lang].join(' ').toLowerCase().includes(k)
  )
})

const active = computed(() => {
  if (!list.value.length) return null
  return list.value.find((c) => c.id === activeId.value) || list.value[0]
})
</script>

<style lang="scss" scoped>
.ec {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ec-top {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--line);
}

.ec-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 0 12px;
  height: 42px;
  transition: 0.18s var(--ease-out);

  &:focus-within {
    border-color: var(--main);
    background: var(--surface);
    box-shadow: 0 0 0 3px rgba(27, 75, 107, 0.06);
  }

  .ico {
    font-size: 15px;
    color: var(--ink3);
    transform: rotate(-20deg);
  }

  input {
    flex: 1;
    border: 0;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: var(--ink);
    font-family: inherit;

    &::placeholder {
      color: var(--ink3);
    }
  }

  .clr {
    font-size: 11px;
    color: var(--ink3);
    cursor: pointer;

    &:hover {
      color: var(--ink);
    }
  }
}

.ec-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;

  .lb {
    font-size: 11px;
    color: var(--ink3);
  }

  .tg {
    font-size: 11.5px;
    color: var(--ink2);
    background: var(--paper);
    border-radius: var(--radius-pill);
    padding: 3px 10px;
    cursor: pointer;
    transition: 0.15s;

    &:hover {
      color: var(--main);
    }

    &.on {
      background: var(--main-soft);
      color: var(--main);
    }
  }
}

.ec-body {
  display: grid;
  grid-template-columns: 322px 1fr;
  min-height: 396px;
}

.ec-list {
  border-right: 1px solid var(--line);
  max-height: 460px;
  overflow: auto;
}

.case {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(230, 224, 211, 0.6);
  cursor: pointer;
  transition: 0.16s;
  border-left: 2px solid transparent;

  &:hover {
    background: var(--paper);
  }

  &.on {
    background: var(--main-soft);
    border-left-color: var(--main);
  }

  .ch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  .lang {
    font-size: 10.5px;
    color: var(--main);
    background: rgba(27, 75, 107, 0.08);
    border-radius: 3px;
    padding: 1px 5px;
  }

  .hits {
    font-size: 10.5px;
    color: var(--ink3);
  }

  .err {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 11px;
    line-height: 1.55;
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
  }

  .sym {
    font-size: 11px;
    color: var(--ink3);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.empty {
  padding: 40px 24px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--ink3);
  text-align: center;
}

.ec-detail {
  padding: 18px 22px 22px;
  max-height: 460px;
  overflow: auto;

  .dhead {
    display: flex;
    gap: 6px;
    margin-bottom: 9px;
  }

  .dlang,
  .dtag {
    font-size: 10.5px;
    border-radius: 3px;
    padding: 1.5px 6px;
  }

  .dlang {
    color: var(--main);
    background: var(--main-soft);
  }

  .dtag {
    color: var(--ink3);
    background: var(--paper);
  }

  .dcode {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 11.5px;
    line-height: 1.7;
    color: #8a3f2c;
    background: var(--paper);
    border-left: 3px solid #c0563f;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    padding: 10px 12px;
    margin: 0 0 16px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .dsec {
    margin-bottom: 13px;

    .dt {
      font-size: 11px;
      color: var(--ink3);
      letter-spacing: 0.3px;
      margin-bottom: 4px;

      &.cause {
        color: var(--accent);
      }

      &.fix {
        color: var(--free);
      }
    }

    p {
      font-size: 12.5px;
      line-height: 1.75;
      color: var(--ink2);
    }

    ol {
      li {
        display: grid;
        grid-template-columns: 17px 1fr;
        gap: 7px;
        font-size: 12.5px;
        line-height: 1.75;
        color: var(--ink2);
        padding: 3px 0;

        .n {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: var(--paper);
          color: var(--ink3);
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 3px;
        }
      }
    }
  }
}
</style>
