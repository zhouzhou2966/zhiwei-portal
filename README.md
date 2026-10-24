# 知微 · 在线学习平台（用户端）

#### 项目简介
> 知微是一个面向工程师的系统化技术学习平台，用户端覆盖「浏览 → 购买 → 学习 → 沉淀」的完整闭环：
> 课程浏览与搜索、课程详情与目录、视频学习（学习进度记录、笔记、问答）、购物车与结算支付、
> 优惠券、以及个人中心（我的课程、学习计划、考试、订单、优惠券、积分、收藏、消息、设置）。

#### 技术栈应用

- Vue 3 + Vite 2 + Element Plus + Pinia + Vue Router 4
- Sass 主题定制：CSS 变量 + Element Plus Sass Map 双重覆盖，统一墨蓝/金配色
- Axios 统一请求封装：Token 自动续期、响应拦截、图片资源映射
- 其他：Swiper（首页轮播）、moment（时间处理）、qrcode.vue（支付二维码）、nprogress（路由进度条）

#### 项目迭代日志：
    - v1.1 完成用户（老师）、课程、搜索、购买、课程学习、优惠券、财务等主流程
    - v1.2 完成免费课程播放：加入学习计划、视频播放（目录与学习计划联动、问答、笔记随播放时间记录）
    - v1.3 完成个人中心（我的课程、学习计划、考试、订单、优惠券、积分、设置）与课程购买链路（购物车、支付、优惠券）

#### 安装运行

``` bash
## 安装依赖
npm install

## 启动项目
npm run dev       # 开发环境，接口指向 http://api.zhiwei.com
npm run dev:test  # 测试环境配置
npm run dev:pro   # 生产环境配置

## 构建
npm run build     # 生产构建，接口地址见 src/config/proxy.js
npm run preview   # 本地预览构建产物
```

#### 访问地址
- 用户端
    - 开发环境：http://localhost:18082
    - 接口网关：http://api.zhiwei.com（各环境配置见 `src/config/proxy.js`）

#### 运行环境 - 初始开发环境及工具

- 项目开发环境: Windows / macOS + Node.js 22 + npm 10

#### 项目结构
```html
zhiwei-portal
│
└───public - 公共静态资源（favicon、logo、默认头像、登录页背景）
│
└───src - 源代码
│   ├── api                            接口定义
│   │   ├── class.js                   - 课程列表、搜索
│   │   ├── classDetails.js            - 课程详情、目录、小节
│   │   ├── notes.js                   - 笔记
│   │   ├── order.js                   - 订单、购物车、支付
│   │   ├── subject.js                 - 学科分类
│   │   └── user.js                    - 登录、注册、个人信息
│   ├── assets                         静态资源（图标、SVG 插画、空状态图）
│   ├── components                     公用组件
│   │   ├── result/index.vue           - 请求结果 404、500 等
│   │   ├── AskChapterItems.vue        - 章节栏-问答模块、笔记
│   │   ├── Breadcrumb.vue             - 公用面包屑，所有详情页面使用
│   │   ├── ClassCards.vue             - 课程展示卡片 - 首页、搜索页
│   │   ├── ClassCategory.vue          - 课程分类
│   │   ├── CouponCards.vue            - 优惠券卡片
│   │   ├── Empty.vue                  - 空状态占位
│   │   ├── MainTitle.vue              - 标题组件
│   │   ├── TableSwitchBar.vue         - tab 切换头部
│   │   ├── Header.vue                 - 公用头部组件
│   │   └── Footer.vue                 - 公用底部组件
│   ├── config
│   │   ├── global.js                  - 全局常量（token 键名等）
│   │   ├── player.js                  - 视频播放器 appId
│   │   └── proxy.js                   - 各环境接口地址
│   ├── pages                          页面
│   │   ├── ask                        - 问答详情
│   │   ├── classDetails               - 课程详情（含目录、问答、笔记、猜你喜欢等子组件）
│   │   ├── classSearch                - 课程搜索
│   │   ├── layouts                    - 整体布局
│   │   ├── learning                   - 课程学习
│   │   │   ├── components             - 目录、笔记、练习、问答
│   │   │   └── index.vue              - 播放器与学习主界面
│   │   ├── login                      - 登录 / 注册
│   │   │   └── components             - 账号登录、短信登录、注册
│   │   ├── main                       - 首页
│   │   │   └── components             - 轮播、兴趣设置
│   │   ├── pay                        - 购物车、结算、支付、支付成功
│   │   ├── personal                   - 个人中心
│   │   │   ├── components             - 订单卡片、日历、考试/计划表格等
│   │   │   ├── style                  - 样式包
│   │   │   ├── myClass                - 我的课程
│   │   │   ├── myCollect              - 我的收藏
│   │   │   ├── myCoupon               - 我的优惠券
│   │   │   ├── myCouponExplain        - 我的优惠券使用说明
│   │   │   ├── myExam                 - 我的考试
│   │   │   ├── myExamDetails          - 我的考试详情
│   │   │   ├── myIntegral             - 我的积分
│   │   │   ├── myIntegralRanking      - 我的积分 - 天梯榜
│   │   │   ├── myMessage              - 我的消息
│   │   │   ├── myOrder                - 我的订单
│   │   │   ├── myOrderDetails         - 我的订单详情
│   │   │   └── mySet.vue              - 个人设置
│   │   └── result                     - 结果页
│   ├── router                         路由
│   │   ├── modules                    - 路由配置
│   │   └── index.js                   - 路由入口
│   ├── store                          Pinia 状态管理
│   │   ├── modules                    - user / permission / dataCache
│   │   └── index.js
│   ├── style                          公用样式
│   │   ├── element                    - Element Plus 主题覆盖
│   │   ├── font_style                 - 图标字体
│   │   ├── theme.scss                 - 主题色变量定义
│   │   └── index.scss                 - 公用样式
│   ├── utils                          工具函数
│   │   ├── request.js                 - 请求封装（拦截器、Token 续期）
│   │   ├── refreshToken.js            - Token 刷新
│   │   ├── brandImage.js              - 图片资源品牌映射
│   │   └── tool.js                    - 通用工具函数
│   ├── permission.js                  路由守卫：登录态校验、进度条
│   ├── App.vue
│   └── main.js
│
└───README.md
```

#### 相关资料
Vue3: https://cn.vuejs.org/guide/introduction.html
Element Plus: https://element-plus.org/zh-CN/
#### 参考文档（项目开发过程中用到的所有技术难点 涉及到的相关参考）
- vite配置: https://vitejs.dev/config/
- Pinia: https://pinia.vuejs.org/zh/
#### 包含的三方技术 简介（如果有的话需要写明）
- 腾讯云视频播放器：https://cloud.tencent.com/document/product/266/58773
- https://tcplayer.vcube.tencent.com/
