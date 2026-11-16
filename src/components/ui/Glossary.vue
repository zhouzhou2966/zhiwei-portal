<!-- 探索 · 概念速查
     30 条术语，按英文首字母索引，中英文都能搜。
     每条给三样：一句话定义、生活类比、常见误解 —— 最后一样才是它存在的理由，
     因为定义到处查得到，误解才是差距。 -->
<template>
  <div class="gl">
    <div class="gl-top">
      <div class="gl-search">
        <span class="ico">⌕</span>
        <input v-model="kw" type="text" placeholder="搜术语，中文或英文都行…" spellcheck="false" />
        <span class="clr" v-if="kw" @click="kw = ''">✕</span>
      </div>
      <div class="gl-alpha">
        <span class="al" :class="{ on: letter === '' }" @click="letter = ''">全部</span>
        <span
          v-for="l in letters"
          :key="l"
          class="al"
          :class="{ on: letter === l, dim: !hasLetter(l) }"
          @click="hasLetter(l) && (letter = letter === l ? '' : l)"
        >{{ l }}</span>
      </div>
    </div>

    <div class="gl-grid">
      <div
        v-for="g in list"
        :key="g.term"
        class="gw"
        :class="{ open: openTerm === g.term }"
        @click="toggle(g.term)"
      >
        <div class="gt">
          <span class="zh">{{ g.term }}</span>
          <span class="en">{{ g.en }}</span>
        </div>
        <p class="gd">{{ g.define }}</p>
        <div class="gmore" v-if="openTerm === g.term">
          <div class="row">
            <span class="lb">类比</span>
            <span class="tx">{{ g.analogy }}</span>
          </div>
          <div class="row myth">
            <span class="lb">误解</span>
            <span class="tx">{{ g.myth }}</span>
          </div>
        </div>
        <span class="plus" v-else>+</span>
      </div>
      <div class="gempty" v-if="!list.length">
        没找到「{{ kw }}」。术语表只有 30 条，试试更短的词，比如「锁」或「缓存」。
      </div>
    </div>

    <div class="gl-foot">
      共 {{ GLOSSARY.length }} 条 · 点任意一条展开类比与常见误解
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { GLOSSARY } from '@/mock/explore'

const kw = ref('')
const letter = ref('')
const openTerm = ref('')

const letters = 'ABCDEFGHIJKLMNOPRSTUVWZ'.split('')
const letterOf = (g) => (g.en || '#')[0].toUpperCase()

const hasLetter = (l) => GLOSSARY.some((g) => letterOf(g) === l)

const list = computed(() => {
  const k = kw.value.trim().toLowerCase()
  return GLOSSARY.filter((g) => {
    if (letter.value && letterOf(g) !== letter.value) return false
    if (!k) return true
    return (g.term + g.en + g.define + g.myth).toLowerCase().includes(k)
  })
})

const toggle = (t) => {
  openTerm.value = openTerm.value === t ? '' : t
}
</script>

<style lang="scss" scoped>
.gl {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 20px 14px;
}

.gl-top {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.gl-search {
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 0 11px;
  height: 36px;
  width: 260px;
  flex: none;
  transition: 0.18s var(--ease-out);

  &:focus-within {
    border-color: var(--main);
    background: var(--surface);
  }

  .ico {
    font-size: 14px;
    color: var(--ink3);
    transform: rotate(-20deg);
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    font-size: 12.5px;
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
  }
}

.gl-alpha {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;

  .al {
    font-size: 11px;
    color: var(--ink2);
    width: 21px;
    height: 21px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    transition: 0.14s;
    font-family: var(--font-sans);

    &:hover {
      background: var(--paper);
    }

    &.on {
      background: var(--main);
      color: #fff;
    }

    &.dim {
      color: var(--line-strong);
      cursor: default;
    }
  }
}

.gl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 14px;
}

.gw {
  position: relative;
  background: var(--paper);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 11px 13px;
  cursor: pointer;
  transition: 0.18s var(--ease-out);
  align-self: start;

  &:hover {
    border-color: var(--line-strong);
    background: var(--surface);
  }

  &.open {
    background: var(--surface);
    border-color: var(--main-soft);
    box-shadow: var(--shadow-1);
  }

  .gt {
    display: flex;
    align-items: baseline;
    gap: 7px;

    .zh {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink);
    }

    .en {
      font-size: 10.5px;
      color: var(--ink3);
      font-family: var(--font-serif);
      letter-spacing: 0.2px;
    }
  }

  .gd {
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--ink2);
    margin-top: 4px;
  }

  .plus {
    position: absolute;
    right: 12px;
    top: 10px;
    font-size: 13px;
    color: var(--ink3);
    line-height: 1;
  }

  .gmore {
    margin-top: 9px;
    padding-top: 9px;
    border-top: 1px dashed var(--line);

    .row {
      display: flex;
      gap: 7px;
      font-size: 11px;
      line-height: 1.65;
      color: var(--ink2);

      & + .row {
        margin-top: 5px;
      }

      .lb {
        flex: none;
        color: var(--ink3);
        font-size: 10.5px;
        padding-top: 1px;
      }

      &.myth .lb {
        color: var(--accent);
      }

      &.myth .tx {
        color: var(--ink2);
      }
    }
  }
}

.gempty {
  grid-column: 1 / -1;
  padding: 28px 0;
  text-align: center;
  font-size: 12px;
  color: var(--ink3);
  line-height: 1.7;
}

.gl-foot {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--ink3);
}
</style>
