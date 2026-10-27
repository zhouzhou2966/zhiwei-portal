<!-- 首页课程栏目（货架）
     布局：**固定 4 列**竖卡（16:9 封面 + 左上角标 + 标题 + 讲师/节数/人数 + 价格）。
     这是 Udemy / Coursera / 极客时间 的通用结构 —— 用户扫一眼就知道怎么读。

     为什么列数不跟着数据走：之前 cols = min(4, 条数)，登录后兴趣过滤只回 3 门，
     这一栏就变成 3 张更宽的卡，跟上下两栏的卡宽对不齐，整页节奏是乱的。
     固定 4 列 ⇒ 任何登录态下卡片尺寸都一致。
     不足 4 门时补一块「浏览全部课程」占位卡把行铺满（span 剩余列），
     不留空洞 —— 否则 3 门课后面空一格，比卡片变宽更难看。
     没有数据时给完整空态，而不是只剩一个标题。 -->
<template>
  <section class="shelf">
    <header class="shelfHead">
      <div class="left">
        <i class="bar"></i>
        <h2 class="title">{{ title }}</h2>
        <span class="sub" v-if="subtitle">{{ subtitle }}</span>
      </div>
      <div class="more" @click="goMore">
        查看全部
        <i class="iconfont zhy-btn_more"></i>
      </div>
    </header>

    <div class="grid" v-if="list.length">
      <CourseCard
        v-for="(item, i) in list"
        :key="item.id"
        :data="item"
        :badge="badge"
        :index="i"
      />
      <!-- 不满 4 门：占位卡横跨剩余列数，把这一行补齐 -->
      <div
        class="moreSlot"
        :class="{ wide: COLS - list.length >= 2 }"
        v-if="list.length < COLS"
        :style="{ gridColumn: `span ${COLS - list.length}` }"
        @click="goMore"
      >
        <div class="txtWrap">
          <span class="txt">浏览全部课程</span>
          <span class="tip">课程库里还有更多内容</span>
        </div>
        <span class="goBtn"><i class="arr"></i></span>
      </div>
    </div>

    <div class="empty" v-else>
      <span class="dot"></span>
      <p>这个栏目暂时还没有课程</p>
      <span class="link" @click="goMore">去课程库看看</span>
    </div>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CourseCard from './CourseCard.vue'

const props = defineProps({
  title: {
    type: String,
    default: '模块标题'
  },
  // 副标题：说明这一栏的取数口径，避免用户以为是随机堆的
  subtitle: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    default: () => []
  },
  // 角标：'top' 出 TOP1/2/3，'new' 出 NEW
  badge: {
    type: String,
    default: null
  }
})

const router = useRouter()

// 列数是设计常量，不是数据推导出来的：所有栏目、所有登录态都按 4 列铺
const COLS = 4

const list = computed(() => (Array.isArray(props.data) ? props.data : []))

const goMore = () => router.push({ path: '/search/index' })
</script>
<style lang="scss" scoped>
.shelf {
  margin-bottom: 46px;

  .shelfHead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 18px;

    .left {
      display: flex;
      align-items: center;
    }

    .bar {
      width: 4px;
      height: 19px;
      margin-right: 10px;
      border-radius: 3px;
      background: linear-gradient(180deg, #EBCB84, #D9A441);
    }

    .title {
      font-size: 21px;
      font-weight: 600;
      letter-spacing: .5px;
      color: var(--color-font1);
    }

    .sub {
      margin-left: 12px;
      font-size: 13px;
      color: var(--color-font3);
    }

    .more {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      color: var(--color-font3);
      cursor: pointer;
      transition: color .18s;

      &:hover {
        color: var(--color-main);
      }

      .iconfont {
        font-size: 22px;
      }
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
    align-items: stretch;
  }

  // 不足 4 门时补的占位卡：横跨剩余列，高度由 grid stretch 拉到与卡片一致。
  // 只缺 1 格时是竖排小卡；缺 2 格以上（比如「免费好课」只有 1 门课）改成横向 CTA 带，
  // 否则一大块虚线框中间浮几个字，看起来就是个洞。
  .moreSlot {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 20px;
    border: 1px dashed #E0D6C3;
    border-radius: 14px;
    background: rgba(255, 255, 255, .5);
    cursor: pointer;
    transition: border-color .2s, background .2s;

    .txtWrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .txt {
      font-size: 14px;
      letter-spacing: .5px;
      color: var(--color-font2);
      transition: color .2s;
    }

    .tip {
      font-size: 12px;
      color: var(--color-font3);
    }

    .goBtn {
      display: none;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid #E7DECB;
      transition: background .2s, border-color .2s;
    }

    .arr {
      width: 9px;
      height: 9px;
      border-top: 1px solid #C8C2B6;
      border-right: 1px solid #C8C2B6;
      transform: rotate(45deg);
      transition: border-color .2s;
    }

    // 缺 2 格以上：横向铺开，文字靠左、按钮靠右
    &.wide {
      justify-content: space-between;
      padding: 0 40px;

      .txtWrap {
        align-items: flex-start;
        gap: 8px;
      }

      .txt {
        font-size: 17px;
        font-weight: 500;
        letter-spacing: 1px;
      }

      .goBtn {
        display: flex;
      }
    }

    &:hover {
      border-color: #D9A441;
      background: #fff;

      .txt {
        color: var(--color-main);
      }

      .goBtn {
        border-color: var(--color-main);
        background: var(--color-main);
      }

      .arr {
        border-color: var(--color-main);
      }
    }

    &.wide:hover .arr {
      border-color: #fff;
    }
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 120px;
    font-size: 14px;
    color: var(--color-font3);
    border: 1px dashed #E0D6C3;
    border-radius: 13px;
    background: rgba(255, 255, 255, .5);

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #D9A441;
    }

    .link {
      color: var(--color-main);
      cursor: pointer;

      &:hover {
        color: var(--color-hover);
      }
    }
  }
}
</style>
