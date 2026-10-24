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
    meta: { title: '课程搜索' },
    children: [
      {
        path: 'index',
        name: 'search',
        component: () => import('@/pages/classSearch/index.vue'),
        meta: { title: '课程搜索' },
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
    path: '/personal',
    component: Layout,
    name: 'personal',
    redirect: '/personal/main',
    meta: { title: '个人中心' },
    children: [
      {
        path: 'main',
        name: 'personalMain',
        component: () => import('@/pages/personal/index.vue'),
        meta: { title: '个人中心首页' },
        children:[
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
            path: 'myMessage',
            name: 'myMessage',
            component: () => import('@/pages/personal/myMessage.vue'),
            meta: { title: '我的消息', active:'myMessage',hidden: true, icon: '&#xe612;'},
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
            path: 'myCollect',
            name: 'myCollect',
            component: () => import('@/pages/personal/myCollect.vue'),
            meta: { title: '我的收藏', active:'myCollect', hidden: true, icon: '&#xe613;'},
          },
          {
            path: 'mySet',
            name: 'mySet',
            component: () => import('@/pages/personal/mySet.vue'),
            meta: { title: '个人设置', active:'mySet', hidden: true, icon: '&#xe617;'},
          }
        ]
      },
    ],
  },
];
