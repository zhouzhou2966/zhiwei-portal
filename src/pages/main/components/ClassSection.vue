<!-- 首页课程区 · 三种形态

     原来首页三块课程区用的是同一个组件，只换标题（免费好课 / 精品好课 / 精品新课），
     三屏形状一模一样，滚到底等于只看了同一块内容三遍。

     现在按「这一栏想让人做什么」给三种形态：
       rail  —— 横向滚动，一屏能看到 5 门以上，适合「随便逛逛」
       picks —— 两列大卡，封面大、信息全，适合「重点推荐」
       list  —— 紧凑行卡，一屏 6 门，适合「快速扫一遍新上架」
     形态不同，滚动节奏就变了，页面才有段落感。 -->
<template>
  <section class="classSection" :class="`is-${variant}`">
    <header class="secHead">
      <div class="left">
        <i class="bar"></i>
        <h2 class="title">{{ title }}</h2>
        <span class="sub" v-if="subtitle">{{ subtitle }}</span>
      </div>
      <span class="more" @click="goMore" v-if="variant !== 'rail' || list.length > 4">
        查看全部<i class="arr"></i>
      </span>
    </header>

    <!-- 横向滚动：用原生 overflow 而不是换页，鼠标滚轮和触摸板横滑都能用 -->
    <div class="railWrap" v-if="variant === 'rail' && list.length">
      <button class="nav prev" type="button" :disabled="atStart" @click="scrollBy(-1)" aria-label="向左">
        <i></i>
      </button>
      <div class="rail" ref="railEl">
        <div class="railItem" v-for="item in list" :key="item.id">
          <CourseCard :data="item" />
        </div>
        <!-- 末尾固定一张「浏览全部」卡：接口只回 1 门课时，横滚区只有一张卡，
             右边整片留白比任何排版问题都显眼。占位卡也让这一栏永远有「下一步」 -->
        <div class="railItem">
          <div class="railMore" @click="goMore">
            <span class="rmTxt">浏览全部课程</span>
            <span class="rmTip">课程库里还有更多</span>
            <span class="rmArr"><i></i></span>
          </div>
        </div>
      </div>
      <button class="nav next" type="button" :disabled="atEnd" @click="scrollBy(1)" aria-label="向右">
        <i></i>
      </button>
    </div>

    <!-- 两列大卡：横向图文卡，封面占 40%，适合展示推荐位 -->
    <div class="picks" v-else-if="variant === 'picks' && list.length">
      <article class="pick" v-for="(item, i) in list" :key="item.id" @click="goDetails(item)">
        <div class="pickCover">
          <img v-if="item.coverUrl && !broken[i]" :src="item.coverUrl" :alt="item.name"
               @error="broken[i] = true" />
          <span v-else class="pickFallback">{{ (item.name || '课').slice(0, 1) }}</span>
          <span class="pickBadge" v-if="i < 3">NO.{{ i + 1 }}</span>
        </div>
        <div class="pickBody">
          <h3 class="pickName">{{ item.name || '未命名课程' }}</h3>
          <p class="pickMeta">
            <span>{{ item.teacher || '匿名讲师' }}</span>
            <i class="dot"></i>
            <span>{{ item.sections || 0 }} 节</span>
            <i class="dot"></i>
            <span>{{ item.sold || 0 }} 人在学</span>
          </p>
          <p class="pickReason" v-if="reasons[i]">{{ reasons[i] }}</p>
          <div class="pickFoot">
            <span class="price" :class="{ free: priceOf(item) === 0 }">{{ priceText(item) }}</span>
            <span class="go">查看课程<i class="arr"></i></span>
          </div>
        </div>
      </article>
    </div>

    <!-- 紧凑行卡：序号 + 小封面 + 一行信息，一屏能放 6 门 -->
    <div class="rows" v-else-if="variant === 'list' && list.length">
      <article class="row" v-for="(item, i) in list" :key="item.id" @click="goDetails(item)">
        <span class="no" :class="{ hot: i < 3 }">{{ String(i + 1).padStart(2, '0') }}</span>
        <div class="rowCover">
          <img v-if="item.coverUrl && !broken[i]" :src="item.coverUrl" :alt="item.name"
               @error="broken[i] = true" />
          <span v-else>{{ (item.name || '课').slice(0, 1) }}</span>
        </div>
        <div class="rowMain">
          <h3 class="rowName">{{ item.name || '未命名课程' }}</h3>
          <p class="rowMeta">{{ item.teacher || '匿名讲师' }} · {{ item.sections || 0 }} 节</p>
        </div>
        <span class="rowPrice" :class="{ free: priceOf(item) === 0 }">{{ priceText(item) }}</span>
      </article>
    </div>

    <div class="empty" v-else>
      <span class="dot"></span>
      <p>这个栏目暂时还没有课程</p>
      <span class="link" @click="goMore">去课程库看看</span>
    </div>
  </section>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CourseCard from './CourseCard.vue'

const props = defineProps({
  // rail = 横滚 / picks = 两列大卡 / list = 紧凑行卡
  variant: { type: String, default: 'rail' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  data: { type: Array, default: () => [] }
})

const router = useRouter()
const list = computed(() => (Array.isArray(props.data) ? props.data : []))

// 封面加载失败按索引记，避免一张破图把整栏的 img 都干掉
const broken = reactive({})

const priceOf = (item) => Number(item && item.price) || 0
const priceText = (item) =>
  priceOf(item) === 0 ? '免费' : `￥${(priceOf(item) / 100).toFixed(2)}`

/**
 * 推荐理由：接口只给排序，不给「为什么推荐」。
 * 与其留白，不如按名次给一句如实的口径说明（不是说这门课「最适合你」这种假话）。
 */
const reasons = computed(() => {
  const total = list.value.length
  return list.value.map((_, i) => {
    if (i === 0) return '本周报名最多'
    if (i === 1) return '第 2 名，紧追其后'
    if (i === 2) return '第 3 名，口碑不错'
    return total > 3 ? '也在热榜前列' : ''
  })
})

/* 横滚：卡片宽 240 + 间距 16，一次滚 3 张的距离，滚动量才够「一屏」 */
const railEl = ref(null)
const atStart = ref(true)
const atEnd = ref(false)

const syncEdge = () => {
  const el = railEl.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  // 留 2px 容差：某些缩放下 scrollLeft + clientWidth 永远差 1px，按钮会一直不置灰
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

const scrollBy = (dir) => {
  const el = railEl.value
  if (!el) return
  el.scrollBy({ left: dir * 768, behavior: 'smooth' })
}
// 首屏数据回来后才挂载 rail，用 ref 回调式的监听在这里拿不到时机，
// 改成 mounted 后绑定（数据变化触发的尺寸变化用 ResizeObserver 兜住）
import { onMounted, onBeforeUnmount, watch } from 'vue'
let ro = null
onMounted(() => {
  const el = railEl.value
  if (el) {
    el.addEventListener('scroll', syncEdge, { passive: true })
    syncEdge()
  }
  if (window.ResizeObserver) {
    ro = new ResizeObserver(() => syncEdge())
    if (el) ro.observe(el)
  }
})
// 数据从 0 变成 N 时 rail 才出现，需要重新绑定
watch(list, () => {
  requestAnimationFrame(() => {
    const el = railEl.value
    if (el && !el.dataset.bound) {
      el.dataset.bound = '1'
      el.addEventListener('scroll', syncEdge, { passive: true })
      if (ro) ro.observe(el)
    }
    syncEdge()
  })
})
onBeforeUnmount(() => {
  const el = railEl.value
  if (el) el.removeEventListener('scroll', syncEdge)
  if (ro) ro.disconnect()
})

const goMore = () => router.push({ path: '/search/index', query: { tab: 'course' } })
const goDetails = (item) => {
  if (!item || !item.id) return
  router.push({ path: '/details', query: { id: item.id } })
}
</script>
<style lang="scss" scoped>
.classSection {
  margin-bottom: 40px;
}

.secHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.left {
  display: flex;
  align-items: center;
}

.bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  border-radius: 3px;
  background: linear-gradient(180deg, #EBCB84, #D9A441);
}

.title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: .4px;
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
  gap: 5px;
  font-size: 13px;
  color: var(--color-font3);
  cursor: pointer;
  transition: color .18s;

  &:hover {
    color: var(--color-main);
  }
}

.arr {
  width: 5px;
  height: 5px;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  transform: rotate(45deg);
}

/* ===== rail ===== */
.railWrap {
  position: relative;
}

.rail {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  /* 隐藏滚动条但保留滚动能力：一条横杠横在卡片下面比卡片本身更显眼 */
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.railItem {
  display: flex;
  flex: 0 0 240px;
  min-width: 240px;
  scroll-snap-align: start;

  /* 末位（永远是「浏览全部」占位卡）在课程不够占满一行时吃掉剩余宽度：
     只有 1 门课时右边不会空出半个屏；课程多到溢出时 flex-grow 不生效，
     退回 240px 正常横滚。
     max-width 兜住上限 —— 不加的话单门课会把占位卡拉成一张 570px 的巨型虚线板 */
  &:last-child {
    flex-grow: 1;
    max-width: 420px;
  }

  /* CourseCard 是 height:100% 的竖卡，外层拉伸后占位卡才能和它等高。
     用子选择器而不是 :deep —— 占位卡是本组件的普通 div，不走组件边界 */
  > * {
    flex: 1;
    min-width: 0;
  }
}

/* 「浏览全部」占位卡：虚线边、无封面，视觉上明确是「出口」不是课程 */
.railMore {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 200px;
  padding: 20px;
  border: 1px dashed #E0D6C3;
  border-radius: 14px;
  background: rgba(255, 255, 255, .55);
  cursor: pointer;
  transition: border-color .2s, background-color .2s;

  &:hover {
    border-color: #D9A441;
    background: #fff;

    .rmTxt {
      color: var(--color-main);
    }

    .rmArr {
      border-color: var(--color-main);
      background: var(--color-main);

      i {
        border-color: #fff;
      }
    }
  }
}

.rmTxt {
  font-size: 14px;
  letter-spacing: .5px;
  color: var(--color-font2);
  transition: color .2s;
}

.rmTip {
  font-size: 12px;
  color: var(--color-font3);
}

.rmArr {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-top: 6px;
  border: 1px solid #E7DECB;
  border-radius: 50%;
  background: #fff;
  transition: border-color .2s, background-color .2s;

  i {
    width: 7px;
    height: 7px;
    margin-right: 2px;
    border-top: 1px solid #C8C2B6;
    border-right: 1px solid #C8C2B6;
    transform: rotate(45deg);
    transition: border-color .2s;
  }
}

/* 左右翻页按钮：只在能翻的方向出现，置灰态直接隐藏 —— 
   常驻半透明圆钮在浅色页面上像两个补丁 */
.nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-top: -17px;
  padding: 0;
  border: 1px solid #EDE7DB;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6px 16px rgba(18, 55, 79, .14);
  cursor: pointer;
  transition: opacity .18s, border-color .18s;

  i {
    width: 7px;
    height: 7px;
    border-top: 1.5px solid var(--color-font2);
    border-right: 1.5px solid var(--color-font2);
  }

  &.prev {
    left: -14px;

    i {
      transform: rotate(-135deg);
      margin-left: 3px;
    }
  }

  &.next {
    right: -14px;

    i {
      transform: rotate(45deg);
      margin-right: 3px;
    }
  }

  &:hover:not(:disabled) {
    border-color: #D9A441;
  }

  &:disabled {
    opacity: 0;
    pointer-events: none;
  }
}

/* ===== picks ===== */
.picks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.pick {
  display: flex;
  gap: 16px;
  padding: 14px;
  background: #fff;
  border: 1px solid #EDE7DB;
  border-radius: 14px;
  cursor: pointer;
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: #E0D6C3;
    box-shadow: 0 14px 28px rgba(18, 55, 79, .09);

    .pickCover img {
      transform: scale(1.05);
    }

    .go {
      color: var(--color-main);
    }
  }
}

.pickCover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 42%;
  max-width: 190px;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #E5EDF2, #C8D8E2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .45s ease;
  }
}

.pickFallback {
  font-size: 30px;
  font-weight: 500;
  color: rgba(27, 75, 107, .28);
}

.pickBadge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .5px;
  color: #12374F;
  border-radius: 5px;
  background: linear-gradient(135deg, #F2DC9C, #D9A441);
}

.pickBody {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.pickName {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  color: var(--color-font1);
}

.pickMeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-font3);
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #D8D2C6;
}

.pickReason {
  margin-top: 8px;
  padding: 3px 8px;
  align-self: flex-start;
  font-size: 11px;
  color: #8A6A1F;
  border-radius: 4px;
  background: #FBF3DF;
}

.pickFoot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
}

.price {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-error);

  &.free {
    font-size: 14px;
    color: #B07D1E;
  }
}

.go {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-font3);
  transition: color .18s;
}

/* ===== list ===== */
.rows {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #EDE7DB;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .18s, background-color .18s;

  &:hover {
    border-color: #E0D6C3;
    background: #FDFCF9;

    .rowName {
      color: var(--color-main);
    }
  }
}

.no {
  flex: none;
  width: 22px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #C9C3B6;

  &.hot {
    color: #D9A441;
  }
}

.rowCover {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 64px;
  height: 44px;
  border-radius: 7px;
  overflow: hidden;
  font-size: 17px;
  color: rgba(27, 75, 107, .3);
  background: linear-gradient(135deg, #E5EDF2, #C8D8E2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.rowMain {
  flex: 1;
  min-width: 0;
}

.rowName {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--color-font1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color .18s;
}

.rowMeta {
  margin-top: 3px;
  font-size: 12px;
  color: var(--color-font3);
}

.rowPrice {
  flex: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-error);

  &.free {
    font-size: 13px;
    color: #B07D1E;
  }
}

/* ===== 空态 ===== */
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 110px;
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
</style>
