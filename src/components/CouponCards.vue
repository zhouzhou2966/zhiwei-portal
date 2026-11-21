<!-- 优惠券卡片（我的优惠券）
     布局：左侧窄票根（面额）+ 中间信息列 + 右侧操作按钮，横向一条。
     宽度交给父级 grid 决定 —— 原来写死 calc(50% - 18px) + margin-right 35px，
     等于把「两列」这件事焊在卡片上，父级想改成单列或三列都得反过来改卡片。 -->
<template>
 <div class="couponCards" :class="{ 'is-soon': isSoon(item) }" v-for="(item, index) in data" :key="index">
   <div class="price ft-cl-wt" v-if="item.discountType == 4 || item.discountType == 1 || item.discountType == 3">
     <div>￥<em>{{item.discountValue / 100}}</em></div>
     <div class="desc" v-if="item.displayRule || item.rule">{{ item.displayRule || item.rule }}</div>
   </div>
   <div class="price ft-cl-wt" v-if="item.discountType == 2 || item.discountType == 5">
     <div><em>{{item.discountValue / 10}}</em>折</div>
     <div class="desc" v-if="item.displayRule || item.rule">{{ item.displayRule || item.rule }}</div>
   </div>
    <div class="info">
        <!-- 同一张券模板持有多张时用 ×N 贴在券名后面。
             原来它是绝对定位在卡片右上角的浮标，会压住换行后的第二行券名，
             还得用 padding-right 给标题让位；跟着名字走之后，这个矛盾不存在了。 -->
        <div class="tit">
          <span class="name">{{ item.displayTitle || item.name }}</span>
          <span class="multiCount" v-if="item.count > 1" :aria-label="`共 ${item.count} 张`">×{{ item.count }}</span>
        </div>
        <p class="meta"><em>适用</em>{{ couponScopeText(item, categoryMap) }}</p>
        <!-- 有效期：未使用页签下换成「N 天后到期」。券是过期作废的东西，
             「2026-11-19 12:00:00」这种全量时间既占位又不提示紧迫度 -->
        <p class="meta" :class="{ 'is-soon': isSoon(item) }" :title="fullTerm(item)">
          <em>有效期</em>{{ termText(item) }}
        </p>
    </div>
    <div class="butCont" v-if="type == 1">
      <span @click="() => {$router.push({path: '/search/index'})}" class="bt">去使用</span>
    </div>
</div>
</template>
<script setup>
import { onMounted, shallowRef } from 'vue';
import { parseDate } from '@/utils/date';
import { couponExpiringSoon, couponDaysLeft } from '@/utils/couponEffect';
import { couponScopeText, loadCategoryMap } from '@/utils/couponScope';
// 分类 id -> 名称，和领券页共用同一份模块级缓存
const categoryMap = shallowRef(new Map());
onMounted(() => {
  loadCategoryMap().then((map) => {
    categoryMap.value = map;
  });
});
const props = defineProps({
  data:{
    type: Object,
    default:{}
  },
  type:{
    type: Number,
    default:1
  }
})

// 7 天内到期算「即将过期」：整张卡描边和有效期行同时变暖色，扫列表时能一眼挑出来先用。
// 天数口径与页面顶部的汇总提示共用 utils/couponEffect 里的同一套计算
const isSoon = (item) => props.type === 1 && couponExpiringSoon(item)

const termText = (item) => {
  const d = couponDaysLeft(item.termEndTime)
  // 没有具体到期时间就退回「领取后 N 天」的原约定
  if (d === null) return item.termDays ? `领取后 ${item.termDays} 天内有效` : '长期有效'
  // 已使用 / 已过期两个页签下，剩余天数没有意义（负数或历史值），给准确日期
  if (props.type !== 1 || d < 0) return parseDate(item.termEndTime).format('YYYY-MM-DD')
  if (d === 0) return '今天到期'
  if (d <= 7) return `${d} 天后到期`
  // 前面有「有效期」em 标签，这里别再带「有效期至」—— 会渲染成「有效期 有效期至 12-01」
  return `${parseDate(item.termEndTime).format('MM-DD')} 到期`
}

// 悬停给全量时间：上面那行是给人扫的概览，精确到分钟的信息留在 title 里
const fullTerm = (item) => {
  const end = parseDate(item.termEndTime)
  return end.isValid() ? `有效期至 ${end.format('YYYY-MM-DD HH:mm')}` : ''
}
</script>
<style lang="scss" scoped>
.couponCards{
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 108px;
  position: relative;
  overflow: hidden;
  background: #FFFFFF;
  border: 1px solid var(--color-background2);
  border-left: none;
  border-radius: 8px;
  transition: border-color .18s, box-shadow .18s;
  &:hover{
    border-color: var(--color-main-light2);
    box-shadow: 0 4px 14px rgba(27, 75, 107, .07);
  }
  /* 即将过期：卡片描边跟着转暖，配合下面那行橙色的「N 天后到期」 */
  &.is-soon{
    border-color: #F2DFBC;
  }
  .price{
    flex: none;
    width: 118px;
    /* 票根图是 334×300 的 svg，这里按 118 宽拉伸。原来 138×124 把卡宽的四成给了面额，
       而用户在这个页面的动作是「挑一张用」，第一眼该看到的是券名，不是面额 */
    background: url('@/assets/bg_yhq1.svg') left center no-repeat;
    background-size: 100% 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: 400;
    font-size: 11px;
    em{
      font-style: normal;
      font-family: PingFangSC-Semibold;
      font-weight: 600;
      font-size: 34px;
      line-height: 38px;
    }
    .desc{
      padding: 0 10px;
      text-align: center;
      line-height: 15px;
    }
  }
  .info{
     display: flex;
     flex-direction: column;
     justify-content: center;
     flex: 1;
     /* min-width:0 是 flex 子项里让文字出省略号的前提，缺了它 .name 会顶宽整张卡 */
     min-width: 0;
     padding: 12px 14px 12px 18px;
     text-align: left;
     font-size: 12px;
     line-height: 20px;
     .tit{
       display: flex;
       align-items: center;
       gap: 6px;
       min-width: 0;
       margin-bottom: 4px;
     }
     .name{
       font-size: 15px;
       font-weight: 500;
       line-height: 22px;
       color: var(--color-font1);
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
     }
     .multiCount{
       flex: none;
       padding: 0 6px;
       height: 18px;
       line-height: 18px;
       border-radius: 9px;
       background: #FFF4E5;
       color: #B07C22;
       font-size: 11px;
       font-weight: 500;
     }
     .meta{
       color: var(--color-font2);
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
       em{
         font-style: normal;
         color: var(--color-font3);
         margin-right: 6px;
       }
       &.is-soon{
         color: var(--color-warning);
         em{
           color: inherit;
           opacity: .75;
         }
       }
     }
  }
  .butCont{
    flex: none;
    display: flex;
    align-items: center;
    padding-right: 16px;
    span{
      display: inline-block;
      min-width: 76px;
      padding: 0 16px;
      height: 30px;
      line-height: 30px;
      border-radius: 15px;
      font-size: 12px;
      text-align: center;
    }
  }
}
</style>
