<!-- 优惠券卡片 -->
<template>
 <div class="couponCards fx" :class="{ hasCount: item.count > 1 }" v-for="(item, index) in data" :key="index">
   <!-- 同一张券模板持有多张时的数量角标。
        user_limit > 1 的券一个人可以领到多张，平铺成几张一模一样的卡
        反而看不出「一共有几张」。领券中心那张列表里 item.count 不存在，不显示。 -->
   <span class="multiCount" v-if="item.count > 1" :aria-label="`共 ${item.count} 张`">×{{ item.count }}</span>
   <div class="price ft-cl-wt" v-if="item.discountType == 4 || item.discountType == 1 || item.discountType == 3">
     <div>￥ <em>{{item.discountValue / 100}}</em></div>
     <div class="desc" v-if="item.displayRule || item.rule">{{ item.displayRule || item.rule }}</div>
   </div>
   <div class="price ft-cl-wt" v-if="item.discountType == 2 || item.discountType == 5">
     <div><em>{{item.discountValue / 10}}</em> 折</div>
     <div class="desc" v-if="item.displayRule || item.rule">{{ item.displayRule || item.rule }}</div>
   </div>
    <div class="info">
        <div class="tit">{{ item.displayTitle || item.name }}</div>
        <div><em>适用分类：</em>{{ couponScopeText(item, categoryMap) }}</div>
      <div><em>有效日期：</em> {{item.termDays ? `${item.termDays}天` : parseDate(item.termEndTime).format('YYYY-MM-DD hh:mm:ss')}}</div>
    </div>
    <div class="butCont fx-ct" v-if="type == 1"><span @click="() => {$router.push({path: '/search/index'})}" class="bt">去使用</span></div>
</div>
</template>
<script setup>
import { onMounted, shallowRef } from 'vue';
import { parseDate } from '@/utils/date';
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
</script>
<style lang="scss" scoped>
.couponCards{
  width: calc(50% - 18px);
  position: relative;
  background: #FFFFFF;
  border: 1px solid #EEEEEE;
  border-left:none;
  border-radius: 8px;
  margin-bottom: 30px;
  margin-right: 35px;
  &:nth-child(2n){
    margin-right: 0;
  }
  .multiCount{
    position: absolute;
    top: 8px;
    right: 10px;
    height: 20px;
    line-height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    background: #FFF4E5;
    color: #B07C22;
    font-size: 12px;
    font-weight: 600;
    /* 不参与 flex 布局，避免把 .butCont 挤走 */
    z-index: 1;
    pointer-events: none;
  }
  /* 有角标时给标题让出位置：券名是运营手填的自由文本，长度不可控，
     不预留空间的话换行后的第二行会钻到角标底下 */
  &.hasCount .tit{
    padding-right: 46px;
  }
  .price{
    width: 138px;
    height: 124px;
    background:url('@/assets/bg_yhq1.svg') left center no-repeat;
    background-size: cover;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: 400;
    font-size: 12px;
    em{
      font-style: normal;
      font-family: PingFangSC-Semibold;
      font-weight: 600;
      font-size: 42px;
    }
    .desc{
        padding: 0 15px;
        text-align: center;
    }
  }
  .info{
     display: flex;
     padding-left: 25px;
     text-align: left;
    flex-direction: column;
    justify-content: center;
    font-size: 12px;
    flex: 1;
    line-height: 28px;
    .tit{
      font-weight: 500;
      font-size: 18px;  
      margin-bottom: 15px;
    }
    em{
      font-style: normal;
      color: var(--color-font3);
    }
    .time{
        white-space:nowrap;
    }
  }
  .butCont{
    padding-right: 20px;
    span{
      font-size: 12px;
      min-width: 80px;
      text-align: center;
      padding: 0px 15px;
      height: 28px;
      line-height: 28px;
      border-radius: 28px;
    }
  }
}
</style>
