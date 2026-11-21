<!-- 概览 · 接下来学（推荐 2 门）
     数据：/ss/recommend/best（三种口径 free/best/new 同一个接口，学习中心用 best）。
     放在概览底部回答「学完这门之后学什么」，原来学习中心没有任何推荐位。 -->
<template>
  <div class="recoCard" v-if="status === 'ok' && items.length > 0">
    <div class="rcRow" v-for="c in items" :key="c.id" @click="go(c)">
      <img :src="c.coverUrl" alt="" @error="onErr($event)">
      <div class="rcTxt">
        <h5 :title="c.name">{{ c.name }}</h5>
        <p>
          <span>{{ Number(c.price) === 0 ? '免费' : '￥' + (Number(c.price) / 100).toFixed(2) }}</span>
          <i></i>
          <span>{{ c.sections || 0 }} 节</span>
          <template v-if="Number(c.sold) > 0">
            <i></i>
            <span>{{ soldText(c.sold) }}</span>
          </template>
        </p>
      </div>
    </div>
    <div class="rcMore" @click="$router.push('/search/index')">去课程首页逛逛 →</div>
  </div>

  <div class="rcEmpty" v-else-if="status === 'ok'">
    <p>暂无推荐</p>
    <span>去课程首页看看别的方向</span>
  </div>
  <div class="rcState" v-else-if="status === 'error'">
    <InlineError title="推荐加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="rcState" v-else>
    <span class="rcTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRecommendClassList } from '@/api/class.js'
import { errMsg, catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'

const router = useRouter()
const items = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getRecommendClassList('best')
    if (res && res.code == 200) {
      items.value = (Array.isArray(res.data) ? res.data : []).slice(0, 2)
      status.value = 'ok'
      return
    }
    errorMsg.value = errMsg(res, '推荐加载失败')
    status.value = 'error'
  } catch (err) {
    errorMsg.value = catchMsg(err, '推荐加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

const soldText = (n) => {
  const v = Number(n) || 0
  return v >= 10000 ? `${(v / 10000).toFixed(1)} 万人在学` : `${v} 人在学`
}
const onErr = (e) => {
  e.target.style.visibility = 'hidden'
}
const go = (c) => router.push({ path: '/details/index', query: { id: c.id } })
</script>
<style lang="scss" scoped>
.recoCard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 6px 22px 12px;
  display: flex;
  flex-direction: column;
}
.rcRow {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px dashed var(--line);
  cursor: pointer;
  &:last-of-type {
    border-bottom: none;
  }
  &:hover h5 {
    color: var(--main);
  }
  img {
    width: 78px;
    height: 49px;
    object-fit: cover;
    border-radius: 7px;
    flex: none;
    background: var(--paper);
  }
}
.rcTxt {
  min-width: 0;
  h5 {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  p {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--ink3);
    span:first-child {
      color: var(--accent);
    }
    i {
      width: 1px;
      height: 9px;
      background: var(--line-strong);
    }
  }
}
.rcMore {
  margin-top: auto;
  padding-top: 10px;
  font-size: 12px;
  color: var(--ink3);
  cursor: pointer;
  &:hover {
    color: var(--main);
  }
}
.rcEmpty {
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
.rcState {
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
.rcTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
