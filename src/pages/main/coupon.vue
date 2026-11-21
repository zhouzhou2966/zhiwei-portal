<!-- 首页 - 选择优惠券 -->
<template>
  <div class="discountChoiceWrapper">
    <!-- 面包屑和「我的优惠券」反向入口放同一行：
         领券页原来是条死路 —— 领完只能关掉，想看自己领了什么得自己去顶栏「学习」里翻 -->
    <div class="container pageHead">
      <Breadcrumb data="优惠券"></Breadcrumb>
      <span class="mineLink" @click="() => router.push('/account/main/myCoupon')">我的优惠券 ›</span>
    </div>
    <div class="couponItems container bg-wt">
      <template v-if="couponData.length > 0">
        <div class="mainCouponCards fx" v-for="(item, index) in couponData" :key="index"
             :class="{ 'is-flying-out': flyingId === item.id }">
          <div class="price ft-cl-wt" v-if="item.discountType == 4 || item.discountType == 1 || item.discountType == 3">
            <div>￥ <em>{{item.discountValue / 100}}</em></div>
            <div class="desc" v-if="item.displayRule">{{ item.displayRule }}</div>
          </div>
          <div class="price ft-cl-wt" v-if="item.discountType == 2 || item.discountType == 5">
            <div><em>{{item.discountValue / 10}}</em> 折</div>
            <div class="desc" v-if="item.displayRule">{{ item.displayRule }}</div>
          </div>
          <div class="info">
            <div class="tit">{{ item.displayTitle || item.name }}</div>
            <div><em>适用分类：</em>{{ couponScopeText(item, categoryMap) }}</div>
            <div><em>有效日期：</em> {{item.termDays ? `${item.termDays}天` : parseDate(item.termEndTime).format('YYYY-MM-DD hh:mm:ss')}}</div>
          </div>
          <!-- 「还能不能再领」和「手里有没有可用的」是两件事，不能再用 received 一票否决：
               user_limit > 1 的券领过一张之后 received 就是 true，原来的写法会把按钮
               直接换成「去使用」，用户再也点不到「领取」，第二张永远领不了。 -->
          <div class="butCont fx-ct">
            <span
              v-if="item.available"
              @click="getCouponData(item, $event)"
              class="bt"
              :class="{ 'bt-loading': receivingId === item.id, 'bt-fail': failId === item.id }"
            >{{ receivingId === item.id ? '领取中' : (item.remainCount > 1 ? `还可领 ${item.remainCount} 张` : '立即领取') }}</span>
            <span v-else-if="item.received" @click="() => $router.push('/search/index')" class="bt">去使用</span>
            <!-- 区分两种「不能领」：库存发完了，还是你自己的额度用完了。
                 后端没返回 soldOut（旧版本）时回退成原来的「已领完」，不显示误导性文案 -->
            <span v-else class="bt bt-grey">{{ item.soldOut === true ? '已领完' : (item.remainCount === 0 ? '已领过' : '已领完') }}</span>
            <!-- 还能领、但手里也有未使用的券：给「去使用」留个次要入口 -->
            <span v-if="item.available && item.received" class="useLink"
                  @click="() => $router.push('/search/index')">去使用</span>
          </div>
        </div>
      </template>
      <!-- 没有可领券时的空状态：等接口返回后再显示，避免首屏闪一下「暂无优惠券」 -->
      <div v-else-if="!loading" class="nodata">
        <Empty desc="暂无优惠券"></Empty>
      </div>
    </div>
    <!-- 领券成功后的翻卡浮层，替代原来的纯文字 toast -->
    <CouponFlipDialog
      v-model:visible="flipVisible"
      :coupons="flipCoupons"
      :origin-rect="flipOrigin"
      @closed="onFlipClosed"
      @use="onFlipUse"
      @mine="goMine"
    />
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
// catchMsg：catch 分支专用（区分超时/断网/401，见 utils/request.js）
import { errMsg, catchMsg } from '@/utils/request'
/** 数据导入 **/

import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { useRouter } from 'vue-router';
import { ElMessage } from "element-plus";
import { parseDate } from '@/utils/date';
import { getCollectableCoupon, getCoupon,formatRule } from "@/api/class.js";
import { isCouponRenderable, couponCopy } from '@/utils/couponEffect';
import { couponScopeText, loadCategoryMap } from '@/utils/couponScope';
// 组件导入
import Breadcrumb from "@/components/Breadcrumb.vue";
import Empty from "@/components/Empty.vue";
import CouponFlipDialog from "@/components/CouponFlipDialog.vue";
const router = useRouter();
const couponData = ref([]);
// 三级分类 id -> 名称：券范围只拿到 id，名称本地映射（模块内缓存，切页面不重复请求）
const categoryMap = shallowRef(new Map());
// 首屏请求未返回前不显示空状态，否则会先闪一下「暂无优惠券」
const loading = ref(true);
// 翻卡浮层：flipCoupons 是「本次领到的券」，目前一次一张，组件按数组设计以便以后扩多张
const flipVisible = ref(false);
const flipCoupons = ref([]);
// 被点的那张列表卡的视口坐标，浮层据此播「卡片飞过来」。
// 存成纯对象而不是 DOMRect：DOMRect 带原型，跨组件传参时容易在响应式包装里出意外。
const flipOrigin = ref(null);
// 正在「飞出去」的那张卡。飞行副本的起点和它在屏幕上完全重合，
// 所以原卡必须在副本出现的同时让位，否则会看到「列表里还留着一张，空中又飞着一张」。
const flyingId = ref(null);
// 正在领取的券 id：按钮据此置灰，挡住连点（后端 Lua 会挡重复领，但前端不该把请求发出去）
const receivingId = ref(null);
// 领取失败的那张券 id：用来抖一下按钮。失败没有浮层（没抢到就没有券面可翻），
// 只靠 ElMessage 的话，注意力在按钮上的用户会以为「点了没反应」。
const failId = ref(null);
let failTimer = 0;
let refreshTimer = 0;
// 本次打开页面里已经领过的券 id。领券是 MQ 异步落库，刷新时后端可能还没算上这张券，
// 不记住的话按钮会在刷新后闪回「立即领取」（用户以为没领到，会再点一次）。
const justClaimed = new Set();

// mounted生命周期
onMounted(() => {
  // 获取可领优惠券（超值优惠券）
  getCollectableCouponData()
  // 分类树与券列表并行拉，谁先回来都不影响对方；失败时文案退化成「指定分类课程」
  loadCategoryMap().then((map) => {
    categoryMap.value = map
  })
});

/** 方法定义 **/
// 获取可领优惠券（超值优惠券）
const getCollectableCouponData = async () => {
  await getCollectableCoupon()
  .then((res) => {
      if (res.code == 200) {
        res.data.forEach(d => {
          d.rule = formatRule(d);
          // 券名里若已经复述了满减条件，展示时剥掉，规则行保留（见 couponCopy 注释）
          const copy = couponCopy(d);
          d.displayTitle = copy.title;
          d.displayRule = copy.rule;
          // 刚领过但 MQ 还没落库的券，强制按「已领」渲染，避免按钮状态回退
          if (justClaimed.has(d.id)) d.received = true;
        });
        couponData.value = res.data;
      } else {
        ElMessage({
          message:errMsg(res),
          type: 'error'
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "分类请求出错！",
        type: 'error'
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

// 优惠券领取
// ⚠️ 后端 receive 是「Redis 扣库存 + 发 MQ」的异步链路，返回 void：
//    接口 200 只代表受理成功，此刻 user_coupon 表里还没有记录。
//    所以成功后既不能立刻重拉列表（received 由未使用记录数算出，必然是 false，按钮会闪回「立即领取」），
//    也不能马上去「我的优惠券」里找这张券——浮层展示的是列表这条数据。
const getCouponData = async (item, ev) => {
  if (receivingId.value) return;   // 并发保护：动画期间/请求未回时不再发第二次
  receivingId.value = item.id;
  // 记下这张卡此刻的位置，供浮层播「飞过来」。必须在点击瞬间取：
  // 领取成功后按钮会从「立即领取」变「去使用」，卡片内容跟着变，再取就不准了。
  const cardEl = ev?.currentTarget?.closest?.('.mainCouponCards');
  const r = cardEl?.getBoundingClientRect();
  flipOrigin.value = r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
  try {
    const res = await getCoupon({ id: item.id });
    if (res.code !== 200) {
      ElMessage({ message: errMsg(res), type: 'error' });
      flashFail(item.id);
      return;
    }
    if (!isCouponRenderable(item)) {
      // 数据异常时不该弹一张空卡面，退回原来的文字提示
      ElMessage({ message: '优惠券领取成功!', type: 'success' });
      scheduleRefresh();
      return;
    }
    // 本地先置为已领：动画期间卡片要显示「去使用」，且列表不该出现「还能再领」的错觉
    item.received = true;
    // user_limit > 1 的券还能继续领，本地把额度递减掉，
    // 否则要等浮层关掉后的定时刷新才更新，用户会以为「领了这张就不能再领了」
    if (typeof item.remainCount === 'number' && item.remainCount > 0) {
      item.remainCount -= 1;
      item.available = item.remainCount > 0;
    }
    justClaimed.add(item.id);
    flipCoupons.value = [item];
    // 原卡让位给飞行副本（必须在 flipVisible 之前设，否则会先看到两张卡同框）
    flyingId.value = item.id;
    flipVisible.value = true;
  } catch (e) {
    ElMessage({ message: catchMsg(e, '领取失败，请稍后重试'), type: 'error' });
    flashFail(item.id);
  } finally {
    receivingId.value = null;
  }
}

/**
 * 失败的轻量反馈：按钮抖一下。
 * 为什么不弹浮层：浮层是「翻卡给人惊喜」的正反馈，失败时再弹一层会把失败包装成奖励，
 * 而且没领到券就没有可信的券面数据可展示。抖动 + 文字提示是成本最低也最准确的空间反馈。
 */
const flashFail = (id) => {
  // 先摘掉再挂，否则同一张券连续失败时 class 没变化，动画不会重播
  failId.value = null;
  window.requestAnimationFrame(() => {
    failId.value = id;
  });
  window.clearTimeout(failTimer);
  failTimer = window.setTimeout(() => {
    failId.value = null;
  }, 420);
}

/**
 * 领券后才刷新列表，且必须延迟。
 * 用户关掉浮层时 MQ 往往还没消费完，立即刷新会让「去使用」闪回「立即领取」，
 * 800ms 是留给消费落库的缓冲；仍没跟上也没关系，下次进页面会自然对齐。
 */
const scheduleRefresh = (delay = 800) => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    getCollectableCouponData();
  }, delay);
}

const onFlipClosed = () => {
  // 浮层关了，让位的卡片要回来（此时后端可能还没落库，卡片显示的是本地置的「去使用」）
  flyingId.value = null;
  scheduleRefresh();
};

// 「去使用」跳搜索页而不是「我的优惠券」：后者要等 MQ 落库才能查到，刚领完进去会看到空列表
const onFlipUse = () => router.push('/search/index');

// 「查看我的优惠券」：同样是刚领完，所以页面顶部给一句到账延迟的预期
const goMine = () => {
  ElMessage({ message: '券到账可能有几秒延迟，刷新即可看到', type: 'info', duration: 3000 });
  router.push('/account/main/myCoupon');
};

onBeforeUnmount(() => {
  window.clearTimeout(refreshTimer);
  window.clearTimeout(failTimer);
});

</script>
<style lang="scss" src="./index.scss"> </style>

<style lang="scss"> 
.discountChoiceWrapper{
  /* 面包屑与「我的优惠券」同一行：入口贴右上，是这条链路的另一半 */
  .pageHead{
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  /* 36px 对齐面包屑的文字行（.breadcrumb 的上内边距就是 36） */
  .mineLink{
    margin-top: 36px;
    font-size: 14px;
    line-height: 20px;
    color: var(--color-font2);
    cursor: pointer;
    &:hover{
      color: var(--color-main);
    }
  }
  .couponItems{
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 50px 50px 20px 50px;
  }
  /* 空状态：与「我的优惠券」页保持同一套写法（Empty 组件 + nodata 容器） */
  .nodata{
    width: 100%;
    height: calc(100vh - 450px);
    min-height: 320px;
    text-align: center;
    line-height: 100px;
    color: var(--color-font2);
  }
  .mainCouponCards{
    width: calc(50% - 20px);
    background: #FFFFFF;
    border: 1px solid #EEEEEE;
    border-left:none;
    border-radius: 8px;
    margin-bottom: 30px;
    margin-right: 40px;
    &:nth-child(2n){
      margin-right: 0;
    }
    /* 正在「飞出去」的那张：浮层的飞行副本起点和它完全重合，
       这里必须在同一帧让位，读起来才是「同一张卡变深色、然后飞向屏幕中央」。
       用 visibility 而不是 opacity —— 要的是瞬时替换，不是淡出；
       淡出会有一小段「两张卡都半透明」的重影。 */
    &.is-flying-out{
      visibility: hidden;
    }
    .price{
      width: 167px;
      height: 150px;
      background:url('@/assets/bg_yhq1.svg') center center no-repeat;
      background-size: cover;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-weight: 400;
      font-size: 14px;
      em{
        font-style: normal;
        font-family: PingFangSC-Semibold;
        font-weight: 600;
        font-size: 42px;
      }
      .desc{
        padding: 0 15px;
        font-size: 12px;
        text-align: center;
      }
    }
    .info{
      display: flex;
      padding-left: 30px;
      text-align: left;
      flex-direction: column;
      justify-content: center;
      font-size: 14px;
      flex: 1;
      line-height: 28px;
      .tit{
        font-weight: 500;
        font-size: 20px;  
        margin-bottom: 15px;
      }
      em{
        font-style: normal;
        color: var(--color-font3);
      }
    }
    .butCont{
      padding: 20px;
      /* 只作用于按钮本身。原来写的是 `.butCont span`，
         结果新加的「去使用」文字链（也是 span）被按 104px 宽的按钮渲染，
         两个元素吃掉 208px，把 .info 挤到只剩 84px —— 券名一字一行 */
      span.bt{
        display: inline-block;
        width: 104px;
        text-align: center;
        height: 40px;
        border-radius: 20px;
      }
      /* 还能领、但手里也有未使用券时的次要入口 */
      .useLink{
        display: inline-block;
        margin-left: 10px;
        font-size: 12px;
        line-height: 40px;
        color: var(--color-font3);
        white-space: nowrap;
        vertical-align: top;
        cursor: pointer;
        &:hover{
          color: var(--color-main);
        }
      }
      /* 领取中：请求未回时置灰并断掉点击，避免连点发出第二个请求 */
      span.bt-loading{
        opacity: 0.6;
        pointer-events: none;
        cursor: default;
      }
      /* 领取失败：横向抖一下（1 次 420ms，与 flashFail 里的清除时长对齐） */
      span.bt-fail{
        animation: coupon-bt-shake 420ms cubic-bezier(.36,.07,.19,.97) both;
      }
    }
  }
}

@keyframes coupon-bt-shake{
  0%, 100% { transform: translateX(0); }
  15%      { transform: translateX(-6px); }
  30%      { transform: translateX(6px); }
  45%      { transform: translateX(-4px); }
  60%      { transform: translateX(4px); }
  80%      { transform: translateX(-2px); }
}

/* 关了动效的用户：抖动会变成「抽一下」，改用静态描边标记，反馈还在但不位移 */
@media (prefers-reduced-motion: reduce){
  .discountChoiceWrapper .couponItems .mainCouponCards .butCont span.bt-fail{
    animation: none;
    box-shadow: 0 0 0 2px rgba(206, 76, 76, 0.55);
  }
}
</style>