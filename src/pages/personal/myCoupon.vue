<!-- 我的优化券 -->
<template>
  <div class="couponWrapper">
    <div class="personalCards">
      <div class="headTop fx-sb">
        <CardsTitle class="marg-bt-20" title="我的优惠券"/>
        <div class="fx">
          <span class="font-bt ft-14" @click="() => dialogVisible = true">兑换优惠券&gt;</span>
          <span @click="() => $router.push({path: '/personal/main/myCouponExplain'})"
                class="font-bt ft-14">优惠券使用说明&gt;</span>
        </div>
      </div>
      <div>
        <TableSwitchBar :data="tableBar" @changeTable="changeTable"></TableSwitchBar>
      </div>
      <!-- 请求失败：明确面板 + 重试。原来只弹一条 toast，列表停在空数组上，
           页面显示「暂无优惠券」，看起来像真的没有券 —— 其实是优惠券服务没起来。
           网关对「服务不存在」回的是 HTTP 200 + code:0，axios 不会 reject。 -->
      <div class="nodata" v-if="status === 'error'">
        <div class="errBox">
          <p class="errTitle">优惠券加载失败</p>
          <p class="errMsg">（{{ errorMsg }}）</p>
          <el-button type="primary" plain size="small" @click="getMyCouponData">重新加载</el-button>
        </div>
      </div>
      <div class="myCouponItems" v-else :class="{'is-empty': myCoupon.length === 0}">
        <!-- 用 <template v-if> 包起来，不要再用 v-else 直接配 list：
             中间只要多插一个 v-if 的元素（比如下面那条「已加载上限」提示），
             v-else 就会被它截走，结果是「有券」和「空状态」同时显示。 -->
        <template v-if="myCoupon.length > 0">
          <CouponCards :data="pagedCoupons" :type="actId"></CouponCards>
          <!-- 一次最多加载 FETCH_LIMIT 条（不分页请求，因为同款多张要在前端聚合）。
               超过时明确告知，否则用户会以为券就这么多 -->
          <p class="tipText couponTruncateTip" v-if="truncated > 0">
            券数量较多，当前只加载了 {{ FETCH_LIMIT }} 张，还有 {{ truncated }} 张未展示
          </p>
          <el-pagination
              v-if="myCoupon.length > pageSize"
              background
              layout="total, prev, pager, next"
              :total="myCoupon.length"
              :page-size="pageSize"
              :current-page="pageNo"
              class="couponPager"
              @current-change="p => pageNo = p"
          />
        </template>
        <div v-else class="nodata">
          <!-- 首屏还没回来时不要立刻显示「空」，否则会闪一下 -->
          <span v-if="status === 'loading'" class="tipText fadeInDelay">正在加载优惠券…</span>
          <Empty v-else></Empty>
        </div>
      </div>
    </div>
    <el-dialog
        v-model="dialogVisible"
        title="兑换优惠券"
        width="440px"
        @closed="resetExchange"
    >
      <div class="exchangeCoupon fx"><span>优惠券码：</span>
        <el-input
            type="text"
            v-model="inputVal"
            maxlength="10"
            clearable
            placeholder="请输入 8~10 位兑换码"
            @input="onCodeInput"
        />
      </div>

      <!-- 预检结果：把「会换到什么券、能不能兑」提前摆出来。
           原来只有点了「兑换」才被一句「超出领取数量」挡住 —— 用户手里只有一串码，
           既不知道换的是什么券，也不知道自己的额度用在哪了，只会觉得「有效码凭什么不给我」。 -->
      <div class="exchangePreview" v-if="previewLoading || preview">
        <div class="pvLoading" v-if="previewLoading">正在查询兑换码…</div>
        <template v-else>
          <!-- 只有真的解析出券模板才画券面。码已被使用 / 无效时后端不会填券信息，
               这时画出来就是一张「优惠券 ¥0」的空卡，比不画更让人困惑。 -->
          <div class="pvCoupon" v-if="preview.couponId" :class="{ 'is-blocked': !preview.canExchange }">
            <div class="pvFace">
              <span class="sym" v-if="previewFace.symbol">{{ previewFace.symbol }}</span><em>{{ previewFace.amount }}</em><span class="unit" v-if="previewFace.unit">{{ previewFace.unit }}</span>
            </div>
            <div class="pvInfo">
              <p class="pvName">{{ previewCopy.title || '优惠券' }}</p>
              <p class="pvRule" v-if="previewCopy.rule">{{ previewCopy.rule }}</p>
              <p class="pvTerm" v-if="preview.termDays">领取后 {{ preview.termDays }} 天内有效</p>
            </div>
          </div>
          <p class="pvTip" :class="{ bad: !preview.canExchange }">
            <template v-if="preview.canExchange">可以兑换，兑完你将持有 {{ preview.userCount + 1 }} 张（每人限领 {{ preview.userLimit }} 张）</template>
            <template v-else>{{ preview.reason || '暂不可兑换' }}</template>
          </p>
        </template>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="exchanging ? null : dialogVisible = false">取消</div>
          <div class="bt" :class="{ 'is-disabled': submitBlocked }"
               @click="submitBlocked ? null : exchangeCouponHandle()">{{ exchangeBtnText }}</div>
        </span>
      </template>
    </el-dialog>

    <!-- 兑换成功后的翻卡浮层。
         兑换是这套动效**语义最吻合**的场景：用户输入一串码时并不知道会得到什么券，
         翻开的确实是新信息。原来这里只有一条「优惠券兑换成功」的 toast，
         等于把唯一一个天然带「惊喜」的时刻白白用掉了。 -->
    <CouponFlipDialog
        v-model:visible="flipVisible"
        :coupons="flipCoupons"
        @use="onFlipUse"
    />
  </div>
</template>
<script setup>

/** 数据导入 **/
import {computed, onMounted, ref} from "vue";
import {ElMessage} from "element-plus";
// errMsg 取业务失败文案（禁止写 res.data.msg）；catchMsg 取网络层失败文案
import {errMsg, catchMsg} from "@/utils/request";
import {getMyCoupon, exchangeCoupon, previewExchangeCoupon, formatRule} from "@/api/class.js";
import {couponCopy, couponFace, isCouponRenderable} from "@/utils/couponEffect";
import {useRoute, useRouter} from "vue-router";
import {dataCacheStore} from "@/store"

// 组件导入
import CardsTitle from "./components/CardsTitle.vue";
import TableSwitchBar from "./components/TableSwitch.vue";
import CouponCards from "@/components/CouponCards.vue";
import CouponFlipDialog from "@/components/CouponFlipDialog.vue";
import Empty from "@/components/Empty.vue";

const route = useRoute()
const router = useRouter()
const store = dataCacheStore()

const tableBar = [
  {id: 1, name: '未使用'},
  {id: 2, name: '已使用'},
  {id: 3, name: '已过期'},
]

// tab切换
const actId = ref(1)
const changeTable = id => {
  actId.value = id
  getMyCouponData()
}

// mounted生命周期
onMounted(async () => {
  getMyCouponData()
});

/** 方法定义 **/
// 我的优惠券数据获取
const myCoupon = ref([])
/**
 * loading / ok / error —— 三态必须显式区分。
 * 原来请求失败时 myCoupon 还是空数组，页面渲染成「暂无优惠券」，
 * 把「服务没起来」伪装成了「你没有券」。
 */
const status = ref('loading')
const errorMsg = ref('')
/**
 * 一次向接口要多少条。列表不做服务端分页，靠一个足够大的上限一次取完 ——
 * 因为「同款多张」要在前端聚合成 ×N，只取一页会算少。
 * 上限之外的条数用 truncated 明确告知，不能让用户以为就这些。
 */
const FETCH_LIMIT = 1000
// 超过 FETCH_LIMIT 没被拉回来的条数，>0 时列表底部给提示
const truncated = ref(0)

/**
 * 展示分页：在已聚合的卡片上切片，不发请求。
 * 为什么不交给后端分页：分页的单位必须是「卡片」而不是 user_coupon 行，
 * 否则同一张券的 3 张会被拆到两页，×N 角标就算错了。
 */
const pageSize = 6
const pageNo = ref(1)
const pagedCoupons = computed(() => {
  const start = (pageNo.value - 1) * pageSize
  return myCoupon.value.slice(start, start + pageSize)
})

/** 列表项统一加工：规则去重 + 券名去重，领券页和这里共用同一套 utils */
const normalizeCouponList = (list) => {
  list.forEach(d => {
    d.rule = formatRule(d)
    // 与领券页同一套去重，避免「我的优惠券」里券名和规则行重复
    const copy = couponCopy(d)
    d.displayTitle = copy.title
    d.displayRule = copy.rule
  })
  return list
}

/**
 * 静默拉一个 tab 的列表：不改 status / myCoupon。
 * 兑换成功后要轮询等 MQ 落库，如果每轮都走 getMyCouponData 会把 status 反复打回
 * loading，列表在浮层底下闪六次「正在加载优惠券…」。
 */
const fetchMyCouponList = async (statusId) => {
  const res = await getMyCoupon({ status: statusId, pageNo: 1, pageSize: FETCH_LIMIT })
  if (res && res.code == 200 && res.data) {
    const list = res.data.list || []
    return { ok: true, list: normalizeCouponList(list), total: Number(res.data.total) || list.length }
  }
  return { ok: false, res }
}

/**
 * 按券模板聚合成一张卡 + 数量角标。
 *
 * user_limit > 1 的券同一个人可以持有多张，后端就是多行记录。平铺渲染会出现几张
 * 一模一样的卡，用户反而看不出「这张券我有几张」。这里按模板 id 聚合，
 * 代表卡沿用第一条（列表按有效期升序，第一条就是最先过期的那张），并记 count。
 *
 * ⚠️ 只用于展示。兑换后找新券的差集必须用**未聚合**的原始行按 userCouponId 比 ——
 *    聚合会把新到的那张并进老卡里，userCouponId 还是老的那个，差集就永远为空。
 */
const aggregateCoupons = (list) => {
  const byTemplate = new Map()
  list.forEach(d => {
    if (d.count == null) d.count = 1
    const hit = byTemplate.get(d.id)
    if (hit) hit.count += 1
    else byTemplate.set(d.id, d)
  })
  return [...byTemplate.values()]
}

/** 统一落地一次列表结果：聚合展示 + 记录被截断的条数 */
const applyList = (r) => {
  myCoupon.value = aggregateCoupons(r.list)
  truncated.value = Math.max((r.total || 0) - r.list.length, 0)
  status.value = 'ok'
  // 数据换了（切 tab / 兑换后刷新）就回到第一页，
  // 否则可能停在一个已经不存在的页码上，看到一片空白
  pageNo.value = 1
}

const getMyCouponData = async () => {
  status.value = 'loading'
  try {
    const r = await fetchMyCouponList(actId.value)
    if (r.ok) {
      applyList(r)
      return
    }
    myCoupon.value = []
    errorMsg.value = errMsg(r.res, '优惠券加载失败，请稍后重试')
    status.value = 'error'
  } catch (err) {
    myCoupon.value = []
    errorMsg.value = catchMsg(err, '优惠券加载失败，请稍后重试') || '请先登录后查看优惠券'
    status.value = 'error'
  }
}

// 兑换优惠券
const dialogVisible = ref(false)
const inputVal = ref('')
const exchanging = ref(false)
// 兑换成功后的翻卡浮层
const flipVisible = ref(false)
const flipCoupons = ref([])

/* ---------- 兑换码预检 ---------- */
// 输入即查：用户手里只有一串码，不查就只能靠点了「兑换」再被拒绝。
// 只读接口，不占名额不动库存，可以放心防抖调用。
const preview = ref(null)
const previewLoading = ref(false)
const previewFace = computed(() => couponFace(preview.value || {}))
// 券名和规则去重，和卡片列表用同一套（运营常把「满299减80」也写进券名）
const previewCopy = computed(() => {
  const p = preview.value || {}
  return couponCopy({...p, rule: formatRule(p)})
})
// 预检明确说不能兑时才禁用按钮；预检没查成（断网/接口异常）不阻断，交给后端给最终结论
const submitBlocked = computed(() => exchanging.value || (!!preview.value && !preview.value.canExchange))
const exchangeBtnText = computed(() => {
  if (exchanging.value) return '兑换中'
  if (preview.value && !preview.value.canExchange) return '无法兑换'
  return '兑换'
})

let previewTimer = 0
let previewSeq = 0
const onCodeInput = () => {
  // 输入变了，旧结论立刻作废，避免「改完码还显示上一张券」
  preview.value = null
  previewLoading.value = false
  if (previewTimer) window.clearTimeout(previewTimer)
  const code = String(inputVal.value || '').trim().toUpperCase()
  // 兑换码是 8~10 位，不足就没必要打接口
  if (code.length < 8) return
  previewTimer = window.setTimeout(() => queryPreview(code), 450)
}

const queryPreview = async (code) => {
  const seq = ++previewSeq
  previewLoading.value = true
  try {
    const res = await previewExchangeCoupon(code)
    if (seq !== previewSeq) return   // 慢请求回来得晚，不能覆盖新输入的结果
    // 只有拿到完整预检结果才采用。其余情况一律当「没查成」：
    // 网关对不存在的路由也回 HTTP 200 + {code:0,msg:"请求路径不存在"}，
    // 如果把它当成「不能兑换」，预检一挂按钮就被禁用，用户连试都试不了。
    // 预检只是提前告知，最终判定必须由兑换接口做。
    preview.value = (res && res.code === 200 && res.data && res.data.valid !== false) ? res.data : null
  } catch (e) {
    if (seq !== previewSeq) return
    // 预检查不了不等于不能兑，清空即可，按钮保持可点
    preview.value = null
  } finally {
    if (seq === previewSeq) previewLoading.value = false
  }
}

const resetExchange = () => {
  inputVal.value = ''
  preview.value = null
  previewLoading.value = false
  if (previewTimer) window.clearTimeout(previewTimer)
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * 兑换成功后找出「新到的那张券」。
 *
 * 为什么要轮询：后端 exchangeCoupon 是 Redis Lua（扣码/校验/原子标记）+ MQ 异步落库，
 * 接口返回 200 只代表受理成功，此刻 user_coupon 表里还没有记录，也不返回 couponId。
 * 所以只能「兑换前记快照 → 兑换后比对差集」，而且要比对几次等 MQ 消费完。
 *
 * ⚠️ 差集必须用 userCouponId，不能用 id：
 *    id 是券模板 id，同一个兑换码对应的券被两个人兑换时 id 完全相同，差集会算空。
 */
const collectFreshCoupons = async (beforeIds) => {
  for (let i = 0; i < 7; i += 1) {
    const r = await fetchMyCouponList(1).catch(() => null)
    if (!r || !r.ok) break
    const fresh = r.list.filter(d => !beforeIds.has(d.userCouponId))
    if (fresh.length) {
      // 兑到的券一定在「未使用」，顺手把页签切回去，否则用户停在已使用 tab 上会以为没到账
      actId.value = 1
      applyList(r)
      return fresh
    }
    await delay(350)
  }
  return []
}

const exchangeCouponHandle = async () => {
  // 兑换码统一去空格转大写：用户从微信里复制过来常带空格或小写
  const code = String(inputVal.value || '').trim().toUpperCase()
  if (code === "") {
    ElMessage({message: '请输入正确的优惠券码'});
    return false
  }
  // 兑换按钮连点会发多个请求：Lua 有防重，但前端不该把注定失败的请求发出去
  if (exchanging.value) return false
  exchanging.value = true
  try {
    // 快照失败不阻断兑换，降级成原来的纯 toast
    let beforeIds = null
    try {
      const snap = await fetchMyCouponList(1)
      if (snap.ok) beforeIds = new Set(snap.list.map(d => d.userCouponId))
    } catch (e) { beforeIds = null }

    const res = await exchangeCoupon({ code })
    if (res.code != 200) {
      ElMessage({
        message: errMsg(res, '优惠券兑换失败'),
        type: 'error',
        grouping: true
      })
      return false
    }
    dialogVisible.value = false
    inputVal.value = ''

    const fresh = beforeIds ? await collectFreshCoupons(beforeIds) : []
    const renderable = fresh.filter(isCouponRenderable)
    if (renderable.length) {
      // 浮层本身就是「兑换成功」的反馈，不再叠一条 toast，否则两套反馈互相抢
      flipCoupons.value = renderable
      flipVisible.value = true
    } else {
      // 轮询 2.5s 仍没等到新券。这里**不能**再说「兑换成功」：
      // 接口 200 只代表受理成功，券有没有落库是另一回事（实测有过「Redis 扣了库存、
      // 兑换码也标记了，但消费端判重把消息丢掉」的静默丢券）。断然说成功会让用户
      // 去列表里找不到券，反而更困惑。说「已受理 + 去哪确认」才是准确的说法。
      ElMessage({
        message: '兑换请求已受理，券到账可能有延迟，请稍后在「我的优惠券」查看',
        type: 'warning',
        duration: 5000
      })
      getMyCouponData()
    }
  } catch (err) {
    // 原来这里写的是「订单列表请求失败！」—— 兑换接口的报错挂了个订单列表的文案
    ElMessage({
      message: catchMsg(err, '优惠券兑换失败，请稍后重试') || '优惠券兑换失败',
      type: 'error',
      grouping: true
    })
  } finally {
    exchanging.value = false
  }
}

// 「去使用」跳搜索页：和领券页一致，不要跳「我的优惠券」（刚兑完 MQ 可能还没落库）
const onFlipUse = () => router.push('/search/index')

</script>
<style lang="scss" src="./index.scss"></style>
