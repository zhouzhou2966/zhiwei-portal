import Layout from '@/pages/layouts/index.vue';

export default [
  {
    path: '/main',
    component: Layout,
    redirect: '/main/index',
    name: 'main',
    meta: { title: '首页' },
    children: [
      {
        path: 'index',
        name: 'index',
        component: () => import('@/pages/main/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'coupon',
        name: 'coupon',
        component: () => import('@/pages/main/coupon.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/pages/main/chat.vue'),
        meta: { title: '群聊' },
      }
    ],
  },
  {
    path: '/search',
    component: Layout,
    name: 'searchRoot',
    redirect: '/search/index',
    meta: { title: '探索' },
    children: [
      {
        path: 'index',
        name: 'search',
        component: () => import('@/pages/classSearch/index.vue'),
        meta: { title: '探索' },
      }
    ],
  },
  {
    path: '/askDetails',
    component: Layout,
    name: 'askDetailsRoot',
    redirect: '/askDetails/index',
    meta: { title: '问题回复详情' },
    children: [
      {
        path: 'index',
        name: 'askDetails',
        component: () => import('@/pages/ask/askDetails.vue'),
        meta: { title: '问题回复详情' },
      }
    ],
  },
  {
    path: '/details',
    component: Layout,
    name: 'detailsRoot',
    redirect: '/details/index',
    meta: { title: '问题详情' },
    children: [
      {
        path: 'index',
        name: 'details',
        component: () => import('@/pages/classDetails/index.vue'),
        meta: { title: '问题详情' },
      }
    ],
  },
  {
    path: '/learning',
    name: 'learningRoot',
    redirect: '/learning/index',
    meta: { title: '学习' },
    children: [
      {
        path: 'index',
        name: 'learning',
        component: () => import('@/pages/learning/index.vue'),
        meta: { title: '学习' },
      }
    ],
  },
  {
    path: '/pay',
    name: 'pay',
    component: Layout,
    redirect: '/pay/settlement',
    meta: { title: '购买' },
    children: [
      {
        path: 'settlement',
        name: 'settlement',
        component: () => import('@/pages/pay/settlement.vue'),
        meta: { title: '结算页' },
      },
      {
        path: 'carts',
        name: 'carts',
        component: () => import('@/pages/pay/carts.vue'),
        meta: { title: '购物车' },
      },
      {
        path: 'payment',
        name: 'payment',
        component: () => import('@/pages/pay/payment.vue'),
        meta: { title: '支付页面' },
      },
      {
        path: 'success',
        name: 'success',
        component: () => import('@/pages/pay/success.vue'),
        meta: { title: '支付页面' },
      }
    ],
  },
  {
    // 学习中心：顶栏「学习」的落点。四个一级入口各自回答一个问题：
    // 概览=接下来学什么，课程=资产，考试=结果，报告=数据复盘。
    // 订单 / 优惠券 / 积分 / 设置迁去了 /account（个人中心）——
    // 原来 5 项平铺混着「学习」和「交易」两种心智，用户找券得在一堆学习项里挑。
    path: '/personal',
    component: Layout,
    name: 'personal',
    redirect: '/personal/main/overview',
    meta: { title: '学习中心' },
    children: [
      {
        path: 'main',
        name: 'personalMain',
        // v2 新壳：顶部 tab + 全宽内容（studyShell.vue）。
        // /account 仍用旧壳（左导航 + 右内容），两边彻底解耦。
        component: () => import('@/pages/personal/studyShell.vue'),
        meta: { title: '学习中心首页' },
        children:[
          {
            path: 'overview',
            name: 'personalOverview',
            component: () => import('@/pages/personal/overview.vue'),
            meta: { title: '学习概览', active:'personalOverview', icon: '&#xe611;'},
          },
          {
            path: 'myClass',
            name: 'myClass',
            component: () => import('@/pages/personal/myClass.vue'),
            meta: { title: '我的课程', active:'myClass', icon: '&#xe611;'},
          },
          {
            // 「全部课程」从我的课程页拆出来的独立页面：课程多的时候原页面会被拉得很长。
            // path 带斜杠是为了 URL 上体现层级（/personal/main/myClass/all），
            // 它仍然是 main 的直接子路由，不额外套一层 router-view。
            // hidden 让它不出现在左侧导航，active 仍指向 myClass，进去后导航还高亮「我的课程」。
            path: 'myClass/all',
            name: 'myClassAll',
            component: () => import('@/pages/personal/myClassAll.vue'),
            meta: { title: '全部课程', current: '我的课程', active:'myClass', hidden: true, icon: '&#xe611;'},
          },
          {
            path: 'myExam',
            name: 'myExam',
            component: () => import('@/pages/personal/myExam.vue'),
            meta: { title: '我的考试', active:'myExam', icon: '&#xe615;'},
          },
          {
            path: 'myExamDetails',
            name: 'myExamDetails',
            component: () => import('@/pages/personal/myExamDetails.vue'),
            meta: { title: '我的考试', current: '考试详情', active:'myExam', hidden: true, icon: '&#xe615;'},
          },
          {
            path: 'report',
            name: 'learningReport',
            component: () => import('@/pages/personal/report.vue'),
            meta: { title: '学习报告', active:'learningReport', icon: '&#xe610;'},
          },
          {
            // 笔记页：笔记接口一直在（播放页右侧在用），学习中心原来没有入口
            path: 'notes',
            name: 'learningNotes',
            component: () => import('@/pages/personal/notes.vue'),
            meta: { title: '学习笔记', active:'learningNotes', icon: '&#xe610;'},
          },
          {
            path: 'myMessage',
            name: 'myMessage',
            component: () => import('@/pages/personal/myMessage.vue'),
            meta: { title: '我的消息', active:'myMessage',hidden: true, icon: '&#xe612;'},
          },
          {
            path: 'myCollect',
            name: 'myCollect',
            component: () => import('@/pages/personal/myCollect.vue'),
            meta: { title: '我的收藏', active:'myCollect', hidden: true, icon: '&#xe613;'},
          }
        ]
      },
    ],
  },
  {
    // 个人中心：交易与账户语义的页面（订单 / 优惠券 / 积分 / 设置）。
    // 壳层直接复用学习中心的 personal/index.vue —— LeftNav 是按「当前路由的
    // matched[1].children」动态生成导航的，挂在哪个分支下就自动显示哪组页面，
    // 所以这里不需要复制任何组件。
    // 物理文件仍留在 pages/personal/：这批页面和个人中心共享 index.scss、
    // TableSwitch、CardsTitle 等一整套依赖，挪目录收益纯代码洁癖，风险不值。
    path: '/account',
    component: Layout,
    name: 'account',
    // 默认落「个人设置」：从头像菜单进来，第一眼先确认「这是谁的账号」，
    // 订单 / 券 / 积分都在左侧导航里一眼可见，不需要替用户猜哪个最重要
    redirect: '/account/main/mySet',
    meta: { title: '个人中心' },
    children: [
      {
        path: 'main',
        name: 'accountMain',
        // 壳层与学习中心共用（左侧导览 + 右侧内容）：LeftNav 按 matched[1].children
        // 自适应生成导航，两个区零复制。差异只在 LeftNav 内部 ——
        // /account 下不显示「学习概览」卡、侧栏头像卡不显示「在学 N 门」
        component: () => import('@/pages/personal/index.vue'),
        meta: { title: '个人中心首页' },
        children: [
          {
            // /account/main 本身没有内容页：空路径子路由把它送到默认页。
            // 不能写在 accountMain 上 —— redirect 会顶掉 component，壳层没了子路由就没地方渲染
            path: '',
            name: 'accountMainDefault',
            redirect: 'mySet',
          },
          {
            path: 'myOrder',
            name: 'myOrder',
            component: () => import('@/pages/personal/myOrder.vue'),
            meta: { title: '我的订单', active:'myOrder', icon: '&#xe60b;'},
          },
          {
            path: 'myOrderDetails',
            name: 'myOrderDetails',
            component: () => import('@/pages/personal/myOrderDetails.vue'),
            meta: { title: '我的订单', current: '订单详情', active:'myOrder', hidden: true, icon: '&#xe60b;'},
          },
          {
            path: 'myCoupon',
            name: 'myCoupon',
            component: () => import('@/pages/personal/myCoupon.vue'),
            meta: { title: '我的优惠券', active:'myCoupon', icon: '&#xe616;'},
          },
          {
            path: 'myCouponExplain',
            name: 'myCouponExplain',
            component: () => import('@/pages/personal/myCouponExplain.vue'),
            meta: { title: '我的优惠券', current: '优惠券说明', active:'myCoupon', hidden: true, icon: '&#xe616;'},
          },
          {
            path: 'myIntegral',
            name: 'myIntegral',
            component: () => import('@/pages/personal/myIntegral.vue'),
            meta: { title: '我的积分', active:'myIntegral', icon: '&#xe610;'},
          },
          {
            path: 'myIntegralRanking',
            name: 'myIntegralRanking',
            component: () => import('@/pages/personal/myIntegralRanking.vue'),
            // 面包屑读的是 title / current：title 是所属一级页（我的积分，点了返回上一级）。
            // 这页不配 current —— 原来是从 myCouponExplain 那条路由复制来的「优惠券说明」，
            // 页面下方大标题已经写了「学霸天梯榜」，面包屑再重复一遍没意义（yyt 要求去掉）
            meta: { title: '我的积分', active:'myIntegral', hidden: true, icon: '&#xe610;'},
          },
          {
            // 个人设置：原来在个人中心里就是 hidden 项（入口只在头像下拉），
            // 拆区之后它明确归个人中心所有，所以取消 hidden 直接进导航
            path: 'mySet',
            name: 'mySet',
            component: () => import('@/pages/personal/mySet.vue'),
            meta: { title: '个人设置', active:'mySet', icon: '&#xe617;'},
          }
        ]
      },
    ],
  },
  {
    // 两个区拆分后的旧路径兼容：收藏夹、外链、以及个别没改到的跳转一律送新地址。
    // 正则只接管这批子页，避免把 /personal 整段吞掉
    path: '/personal/main/:sub(myOrder|myOrderDetails|myCoupon|myCouponExplain|myIntegral|myIntegralRanking|mySet)',
    redirect: to => ({ path: `/account/main/${to.params.sub}` }),
  },
];
