/**
 * 探索页专用数据（v42 · 学习工具箱）
 *
 * 这一页刻意不提供「课程 / 知识卡 / 专题 / 笔记」列表 —— 那些在首页。
 * 这里给的是四类首页给不出的东西：结果因人而异的工具、能动手的题、可检索的故障库、可查的术语。
 *
 * 全部为冷启动 mock：
 *   ROLE_MODELS  岗位能力模型（"你差什么"的数据源）
 *   QUIZ_BANK    每日挑战题库
 *   ERROR_CASES  报错诊所案例库（真实报错原文 + 三步解法）
 *   GLOSSARY     概念速查词条
 *   STUDY_ROOMS  共学房间
 */

/* ========== 1. 岗位能力模型 ==========
 * level: 目标岗位要求（1-5）
 * self : 演示账号的自评起点（用户可点格子改，存 localStorage）
 * gap  : 该技能补起来的大致时长（分钟）
 */
export const ROLE_MODELS = [
  {
    id: 'java',
    name: 'Java 后端工程师',
    sub: '3 年经验 · 一线互联网',
    salary: '25-40K',
    skills: [
      { key: 'jvm', name: 'JVM 与性能调优', level: 4, self: 3, gap: 300, tip: '堆栈分析、GC 日志、Arthas 定位慢方法' },
      { key: 'spring', name: 'Spring 生态', level: 5, self: 4, gap: 180, tip: 'IOC 源码、事务传播、AOP 织入顺序' },
      { key: 'mysql', name: 'MySQL 与索引设计', level: 4, self: 2, gap: 420, tip: '执行计划、覆盖索引、分库分表边界' },
      { key: 'redis', name: 'Redis 缓存治理', level: 4, self: 3, gap: 240, tip: '穿透/击穿/雪崩、分布式锁、大 key' },
      { key: 'mq', name: '消息队列与最终一致', level: 3, self: 1, gap: 300, tip: '顺序消息、幂等消费、事务消息' },
      { key: 'micro', name: '微服务拆分与治理', level: 4, self: 2, gap: 360, tip: '拆分粒度、服务熔断、链路追踪' },
      { key: 'concur', name: '并发与线程池', level: 4, self: 2, gap: 300, tip: '线程池参数、拒绝策略、锁升级' },
      { key: 'k8s', name: '容器与 K8s 运维', level: 3, self: 1, gap: 420, tip: '镜像分层、探针、滚动发布' }
    ]
  },
  {
    id: 'fe',
    name: '前端工程师',
    sub: '3 年经验 · 中大型业务',
    salary: '22-35K',
    skills: [
      { key: 'js', name: 'JavaScript 语言内功', level: 5, self: 4, gap: 240, tip: '闭包、原型链、事件循环、微任务' },
      { key: 'css', name: 'CSS 布局与层叠', level: 4, self: 3, gap: 180, tip: 'Flex 收缩、BFC、层叠上下文' },
      { key: 'vue', name: '框架原理', level: 4, self: 3, gap: 300, tip: '响应式依赖收集、diff、编译优化' },
      { key: 'engineer', name: '工程化与构建', level: 4, self: 2, gap: 300, tip: 'Vite 依赖预构建、分包、Tree Shaking' },
      { key: 'perf', name: '性能优化', level: 4, self: 2, gap: 360, tip: 'LCP/INP、首屏、长列表虚拟滚动' },
      { key: 'net', name: '浏览器与网络', level: 3, self: 3, gap: 180, tip: '缓存策略、跨域、HTTP/2 多路复用' },
      { key: 'ts', name: 'TypeScript 类型设计', level: 4, self: 2, gap: 300, tip: '泛型约束、条件类型、类型体操边界' },
      { key: 'test', name: '前端测试', level: 3, self: 1, gap: 240, tip: '单测边界、组件测试、E2E 取舍' }
    ]
  },
  {
    id: 'data',
    name: '数据分析师',
    sub: '2 年经验 · 业务分析',
    salary: '18-28K',
    skills: [
      { key: 'sql', name: 'SQL 取数能力', level: 5, self: 3, gap: 240, tip: '窗口函数、留存/漏斗写法、去重口径' },
      { key: 'stat', name: '统计与实验', level: 4, self: 2, gap: 360, tip: '假设检验、A/B 分流、样本量' },
      { key: 'metric', name: '指标体系搭建', level: 4, self: 2, gap: 300, tip: '北极星指标、OSM 模型、口径对齐' },
      { key: 'viz', name: '可视化表达', level: 3, self: 3, gap: 120, tip: '图表选型、结论先行、看板分层' },
      { key: 'python', name: 'Python 数据处理', level: 4, self: 2, gap: 300, tip: 'pandas 分组聚合、缺失值、性能' },
      { key: 'biz', name: '业务拆解', level: 4, self: 2, gap: 420, tip: '归因拆解、同期群、ROI 计算' }
    ]
  },
  {
    id: 'test',
    name: '测试开发工程师',
    sub: '3 年经验 · 自动化方向',
    salary: '20-32K',
    skills: [
      { key: 'auto', name: '自动化框架设计', level: 5, self: 2, gap: 420, tip: '分层设计、数据驱动、用例治理' },
      { key: 'api', name: '接口测试', level: 4, self: 3, gap: 240, tip: '契约校验、Mock、链路串联' },
      { key: 'perf', name: '性能测试', level: 4, self: 1, gap: 360, tip: '压测模型、TPS 拐点、瓶颈定位' },
      { key: 'code', name: '编码能力', level: 4, self: 3, gap: 300, tip: 'Java/Python 工程能力、日志与断言' },
      { key: 'cicd', name: '持续集成', level: 3, self: 2, gap: 240, tip: '流水线编排、质量门禁、环境隔离' },
      { key: 'quality', name: '质量度量', level: 3, self: 1, gap: 240, tip: '缺陷密度、逃逸率、覆盖率有效性' }
    ]
  }
]

/* ========== 2. 每日挑战题库 ==========
 * answer 是选项下标；tag 用于结果页给「你该补什么」的关联
 */
export const QUIZ_BANK = [
  {
    id: 'q1',
    tag: 'CSS 布局',
    q: '一个 flex 子项里放了很长的一段文本，容器被撑破，父级设置 overflow:hidden 也没用。最可能的原因？',
    options: [
      '子项默认 min-width:auto，不会小于内容宽度',
      '父级缺少 display:flex',
      '文本节点不参与 flex 收缩计算',
      '需要给子项设置 flex-grow: 0'
    ],
    answer: 0,
    explain: 'flex 子项的 min-width 默认是 auto，等于内容的最小宽度。给它 min-width:0（或 overflow:hidden）后才允许压到内容宽度以下。'
  },
  {
    id: 'q2',
    tag: 'Spring',
    q: '@Transactional 加在同一个类的方法 A 上，A 内部直接调用同类的事务方法 B，B 的事务会生效吗？',
    options: [
      '会，B 上有注解就生效',
      '不会，自调用不走代理',
      '会，只要 B 是 public',
      '取决于是否开启 aspectj 模式'
    ],
    answer: 1,
    explain: 'Spring 事务基于代理对象。this.b() 走的是原始对象，绕过了代理，注解不生效。解法：注入自身、拆到另一个 Bean，或用 AspectJ 织入。'
  },
  {
    id: 'q3',
    tag: 'MySQL',
    q: '下面哪种写法最可能让索引失效？',
    options: [
      'WHERE create_time > "2026-01-01"',
      'WHERE DATE(create_time) = "2026-01-01"',
      'WHERE name LIKE "张%"',
      'ORDER BY id DESC LIMIT 10'
    ],
    answer: 1,
    explain: '对索引列做函数运算（DATE()）会让 B+ 树无法按原值定位。改成范围查询 create_time >= "2026-01-01" AND create_time < "2026-01-02"。'
  },
  {
    id: 'q4',
    tag: 'Redis',
    q: '用 SETNX 做分布式锁，业务执行超时导致锁过期，另一个线程拿到锁；此时第一个线程执行完删锁，会出什么问题？',
    options: [
      '没问题，删的是自己那把',
      '会误删别人的锁，需要用唯一 value + Lua 校验后删除',
      '只会导致死锁，不影响数据',
      'SETNX 自带线程绑定，不会误删'
    ],
    answer: 1,
    explain: '锁没有归属标识就会误删。做法：value 存 UUID，删除时用 Lua 比对 value 再 DEL，保证「校验+删除」原子。'
  },
  {
    id: 'q5',
    tag: 'JVM',
    q: '线上服务每隔几秒就 Full GC 一次，堆内存却只用了 30%。最该先看什么？',
    options: [
      '加大 -Xmx',
      'Metaspace / 直接内存是否泄漏，以及显式 System.gc()',
      '换成 G1 回收器就好了',
      '把年轻代调大'
    ],
    answer: 1,
    explain: '堆占用低却频繁 Full GC，通常不是堆不够。查 Metaspace 是否持续增长（动态代理/热部署）、直接内存是否泄漏，以及是否有代码显式调用 System.gc()。'
  },
  {
    id: 'q6',
    tag: '并发',
    q: '线程池核心 4、最大 8、队列容量 100。瞬间来了 200 个任务，会怎样？',
    options: [
      '直接扩到 8 个线程，其余排队',
      '先把队列塞满 100 个，再扩到 8 线程，剩下的走拒绝策略',
      '全部排队，不会拒绝',
      '立刻触发拒绝策略'
    ],
    answer: 1,
    explain: '线程池的次序是：核心线程 → 队列 → 扩容到最大 → 拒绝。队列很大的时候最大线程数几乎用不上，这也是「固定大小线程池 + 无界队列」会 OOM 的原因。'
  },
  {
    id: 'q7',
    tag: '网络',
    q: '接口偶发 502，同时后端日志没有请求记录。最可能是哪一层的问题？',
    options: [
      '业务代码抛了未捕获异常',
      '网关/负载均衡到上游的连接建立失败或上游进程已退出',
      '数据库连接池耗尽',
      '前端请求超时'
    ],
    answer: 1,
    explain: '502 是网关收到的上游响应非法或连接失败；后端完全没有日志，说明请求没进到应用。优先查上游实例存活、端口监听、连接队列与 keepalive 配置。'
  },
  {
    id: 'q8',
    tag: 'Vue',
    q: 'Vue 3 里 reactive 包裹的对象整体重新赋值后视图不更新，为什么？',
    options: [
      'reactive 只能用于数组',
      '整体赋值替换了代理引用，模板持有的还是旧代理',
      '需要调用 nextTick',
      'reactive 不支持对象嵌套'
    ],
    answer: 1,
    explain: 'reactive 返回的是原对象的 Proxy。直接 obj = {...} 只是把变量指向了新对象，代理关系断了。用 ref 或 Object.assign 保留引用。'
  },
  {
    id: 'q9',
    tag: '工程化',
    q: 'Docker 构建时，先 COPY 全部源码再 RUN npm install，会导致什么？',
    options: [
      '没有影响',
      '每次改一行业务代码都会让依赖层缓存失效，构建变慢',
      '镜像体积翻倍',
      'npm install 会失败'
    ],
    answer: 1,
    explain: '层缓存按内容哈希命中。先 COPY package*.json 再 install，最后 COPY 源码，依赖层才能在只改代码时复用。'
  },
  {
    id: 'q10',
    tag: '分布式',
    q: 'TCC 与 Saga 最本质的区别是？',
    options: [
      'TCC 是强一致，Saga 是最终一致',
      'TCC 需要业务提供 Try/Confirm/Cancel 三个接口并做资源预留，Saga 是长事务+补偿',
      'Saga 不能跨服务',
      'TCC 不需要幂等'
    ],
    answer: 1,
    explain: 'TCC 是两阶段资源预留，隔离性靠业务自己保证；Saga 是一串本地事务加反向补偿，中间状态对外可见。两者都要处理幂等与空补偿。'
  },
  {
    id: 'q11',
    tag: '数据库',
    q: '同样的查询，加了 LIMIT 之后反而更慢，最可能的原因是？',
    options: [
      'LIMIT 会让索引失效',
      '优化器换了执行计划，比如放弃了更合适的索引',
      'LIMIT 必须配合 ORDER BY',
      '数据量太大'
    ],
    answer: 1,
    explain: 'LIMIT 会改变优化器的代价估算，可能选到「看起来行数少」但回表多的计划。用 EXPLAIN 对比，必要时 FORCE INDEX。'
  },
  {
    id: 'q12',
    tag: '可观测性',
    q: '一次请求的 P99 很高，但 P50 正常，平均耗时也正常。说明了什么？',
    options: [
      '整体性能没问题，可以忽略',
      '少数请求遭遇了排队、锁等待或下游抖动，平均值掩盖了长尾',
      '监控数据有误',
      '需要扩容机器'
    ],
    answer: 1,
    explain: '平均值和 P50 会掩盖长尾。P99 高通常指向排队、GC 停顿、锁竞争、连接池打满或个别下游慢。要按分位看，并拆分到单次调用链路。'
  }
]

/* ========== 3. 报错诊所 ==========
 * 模拟真实搜索：按 symptom/cause/error 关键词匹配
 */
export const ERROR_CASES = [
  {
    id: 'e1',
    error: 'java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null',
    lang: 'Java',
    symptom: '方法里对一个字段直接调方法，运行到某条数据就崩。',
    cause: '字段在部分分支没有被赋值：数据库里该列可为空，或 Map.get 取不到 key 时返回 null。',
    steps: [
      '看报错里的变量名与行号，确认是哪一次调用传了 null',
      '在入口处用 Objects.requireNonNull 或默认值兜住，别在调用点层层判空',
      '如果是 DTO 字段，检查映射配置：数据库 null → 对象 null 是否被误当成空串处理'
    ],
    hits: 412,
    tag: '空指针'
  },
  {
    id: 'e2',
    error: 'java.lang.OutOfMemoryError: Java heap space',
    lang: 'Java',
    symptom: '运行一段时间后进程退出，日志最后一行是 OOM。',
    cause: '大对象一次性加载、集合只增不减、分页查询被写成全量查询，都会把堆撑满。',
    steps: [
      '启动参数加 -XX:+HeapDumpOnOutOfMemoryError，先拿到 dump',
      '用 MAT / jmap 看支配树，找占比最高的那类对象',
      '顺着 GC Root 引用链确认是谁在持有，别急着加 -Xmx'
    ],
    hits: 386,
    tag: '内存'
  },
  {
    id: 'e3',
    error: 'Web server failed to start. Port 8080 was already in use.',
    lang: 'Java',
    symptom: '本地起服务直接失败，提示端口被占用。',
    cause: '上一个进程没退干净（IDE 停止按钮常常只断开了调试连接），或别的服务占了同一端口。',
    steps: [
      'lsof -i:8080 或 netstat -ano | findstr 8080 找到 PID',
      '确认是不是自己的残留进程，是就 kill 掉',
      '长期方案：开发环境用随机端口或配置 server.port 参数化'
    ],
    hits: 298,
    tag: '启动'
  },
  {
    id: 'e4',
    error: "Access denied for user 'root'@'localhost' (using password: YES)",
    lang: 'MySQL',
    symptom: '连接数据库被拒绝，密码明明是对的。',
    cause: '账号的 host 授权不匹配（root@localhost 与 root@% 是两条记录），或密码插件与客户端不兼容。',
    steps: [
      'SELECT user, host, plugin FROM mysql.user; 看有没有对应 host 的记录',
      '容器场景下确认连接的是容器内网地址，不是宿主机 127.0.0.1',
      '必要时重建授权：CREATE USER ... IDENTIFIED WITH mysql_native_password'
    ],
    hits: 271,
    tag: '数据库'
  },
  {
    id: 'e5',
    error: "Access to XMLHttpRequest at 'http://api.x.com/a' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header",
    lang: '浏览器',
    symptom: '接口在 Postman 里正常，浏览器里全部失败。',
    cause: '跨域请求的预检（OPTIONS）没有返回允许头；或网关把预检请求转给了业务服务，而业务没处理 OPTIONS。',
    steps: [
      '先看 Network 里有没有 OPTIONS 请求，以及它的响应头',
      '在网关统一加 CORS 处理，并放行 OPTIONS 不做鉴权',
      '带 Cookie 时必须指定具体 Origin，不能用 *'
    ],
    hits: 508,
    tag: '跨域'
  },
  {
    id: 'e6',
    error: "TypeError: Cannot read properties of undefined (reading 'map')",
    lang: 'JavaScript',
    symptom: '页面白屏或某个列表渲染时报错。',
    cause: '接口返回结构和你以为的不一样：分页数据在 data.list，而代码读了 data.records；或首屏渲染时数据还没到。',
    steps: [
      '先把接口原始响应打印出来，别猜字段名',
      '渲染前兜底：Array.isArray(list) ? list : []',
      '给列表加 loading 分支，避免用空数据跑渲染逻辑'
    ],
    hits: 634,
    tag: '前端'
  },
  {
    id: 'e7',
    error: 'npm ERR! code ERESOLVE — unable to resolve dependency tree',
    lang: 'Node',
    symptom: 'npm install 直接失败，提示 peer dependency 冲突。',
    cause: '两个包要求同一个依赖的不同大版本，npm 7+ 不再默默兼容。',
    steps: [
      '读报错里的 "Found" 与 "Could not resolve" 两段，确认冲突的包和版本',
      '优先升级直接依赖到兼容版本，而不是 --force',
      '确需临时绕过时用 --legacy-peer-deps，并在 README 记下原因'
    ],
    hits: 322,
    tag: '构建'
  },
  {
    id: 'e8',
    error: 'Deadlock found when trying to get lock; try restarting transaction',
    lang: 'MySQL',
    symptom: '高并发下偶发事务回滚，日志里是死锁。',
    cause: '两个事务以相反顺序锁了相同的行；或缺少合适索引导致间隙锁范围过大。',
    steps: [
      'SHOW ENGINE INNODB STATUS 看 LATEST DETECTED DEADLOCK 段',
      '统一多表更新顺序，缩短事务，别在事务里做远程调用',
      '给 WHERE 条件补索引，减少锁范围'
    ],
    hits: 187,
    tag: '数据库'
  },
  {
    id: 'e9',
    error: 'Error response from daemon: driver failed programming external connectivity: port is already allocated',
    lang: 'Docker',
    symptom: 'docker run 起容器时报端口占用。',
    cause: '宿主机端口已被别的容器或进程占用，容器删除后 iptables 规则可能残留。',
    steps: [
      'docker ps -a 看是否有旧容器还占着端口',
      'ss -lntp | grep 端口 确认宿主机进程',
      '必要时重启 docker 服务清理残留规则'
    ],
    hits: 156,
    tag: '容器'
  },
  {
    id: 'e10',
    error: '504 Gateway Time-out',
    lang: 'Nginx',
    symptom: '某个导出接口固定几分钟后失败，其它接口正常。',
    cause: '网关的读超时短于业务处理时间；也可能是上游线程池被慢请求占满。',
    steps: [
      '对比 proxy_read_timeout 与接口实际耗时',
      '长任务改成异步：先返回任务 id，再轮询结果',
      '确认上游连接池/线程池是否有排队'
    ],
    hits: 244,
    tag: '网关'
  }
]

/* ========== 4. 概念速查 ==========
 * define 一句话；analogy 生活类比；myth 常见误解（这部分比定义更值钱）
 */
export const GLOSSARY = [
  { term: '幂等', en: 'Idempotency', define: '同一操作执行一次和执行多次，结果一样。', analogy: '电梯按钮按十次和按一次，电梯都只来一趟。', myth: '「加了唯一索引就幂等」——只覆盖插入，更新和扣减仍会重复累加。' },
  { term: '最终一致性', en: 'Eventual Consistency', define: '允许中间短暂不一致，但没有新的写入后会收敛到一致。', analogy: '转账短信可能晚到几秒，但账目最终对得上。', myth: '「最终一致 = 可以不一致」——它要求有补偿或对账机制保证收敛。' },
  { term: '缓存穿透', en: 'Cache Penetration', define: '查询一个根本不存在的 key，请求每次都落到数据库。', analogy: '每次都问前台「有没有叫张三的」，而这栋楼没这个人。', myth: '和缓存击穿混为一谈；击穿是热点 key 失效，穿透是 key 不存在。' },
  { term: '缓存击穿', en: 'Cache Breakdown', define: '某个热点 key 过期瞬间，大量并发同时回源。', analogy: '网红店招牌菜卖完的那一刻，所有人一起涌进后厨。', myth: '以为加长过期时间就解决；关键在重建时加互斥锁或逻辑过期。' },
  { term: '缓存雪崩', en: 'Cache Avalanche', define: '大批 key 在同一时刻失效，数据库被瞬间打满。', analogy: '整栋楼同时停电，所有人一起走楼梯。', myth: '只加随机过期时间不够，还需要降级与限流兜底。' },
  { term: '熔断', en: 'Circuit Breaker', define: '下游错误率超阈值时快速失败，避免拖垮调用方。', analogy: '保险丝烧断保护整条电路。', myth: '「熔断就是限流」——熔断看错误率，限流看流量。' },
  { term: '背压', en: 'Backpressure', define: '下游处理不过来时，把压力反向传导给上游降速。', analogy: '水管下游堵了，上游的水龙头就得关小。', myth: '以为加队列就是解决；无界队列只是把崩溃推迟。' },
  { term: '乐观锁', en: 'Optimistic Lock', define: '先改再校验版本号，冲突就重试。', analogy: '先写完作业再对答案，不对就重写。', myth: '「乐观锁不用锁」——数据库层面仍要靠版本条件保证 CAS。' },
  { term: '回表', en: 'Back to Table', define: '二级索引拿到主键后，再回聚簇索引取整行数据。', analogy: '先查目录找页码，再翻到那一页看正文。', myth: '以为索引里有所有字段；只有覆盖索引才不用回表。' },
  { term: '覆盖索引', en: 'Covering Index', define: '查询需要的列都在索引里，不需要回表。', analogy: '目录里直接写了答案，不用翻正文。', myth: '以为 SELECT * 也能覆盖；列一多就必然回表。' },
  { term: '幻读', en: 'Phantom Read', define: '同一事务内两次查询，第二次多出了别的事务插入的行。', analogy: '数了一遍房间里有 3 个人，回来发现变 4 个。', myth: '和不可重复读混淆；幻读针对「行数变化」，不可重复读针对「同一行值变化」。' },
  { term: 'MVCC', en: 'Multi-Version Concurrency Control', define: '用版本链和 ReadView 让读不加锁也能看到一致快照。', analogy: '每个人拿到的是自己进店那一刻的菜单。', myth: '以为 MVCC 解决了所有并发问题；写写冲突仍要靠锁。' },
  { term: 'CAP', en: 'Consistency / Availability / Partition tolerance', define: '分区容错前提下，一致性与可用性只能选一个。', analogy: '两个仓库之间路断了，要么拒单（保一致），要么各卖各的（保可用）。', myth: '「三选二」是简化说法；P 是前提，真正选的是 C 与 A 的取舍程度。' },
  { term: '事件循环', en: 'Event Loop', define: 'JS 单线程靠任务队列轮转，宏任务之间清空微任务。', analogy: '一个服务员，先做完手上这桌（同步），再清空排队的小单（微任务）。', myth: '以为 setTimeout(fn, 0) 会立刻执行；它排在下一个宏任务。' },
  { term: '闭包', en: 'Closure', define: '函数记住并访问了定义时所在作用域的变量。', analogy: '随身带着出生地的一把钥匙。', myth: '以为闭包捕获的是值的副本；捕获的是变量本身（引用）。' },
  { term: '原型链', en: 'Prototype Chain', define: '对象找不到属性时，沿 __proto__ 逐级向上查找。', analogy: '问不到就问家长，家长不知道再问爷爷。', myth: '以为 class 是新机制；ES6 class 仍基于原型。' },
  { term: '防抖', en: 'Debounce', define: '停止触发一段时间后才执行一次。', analogy: '电梯门等人，没人再进才关门。', myth: '和节流搞反；节流是固定频率执行。' },
  { term: 'Tree Shaking', en: 'Tree Shaking', define: '构建时删掉没有被引用的导出代码。', analogy: '搬家只带用得上的东西。', myth: '以为写了 ESM 就一定生效；副作用声明（sideEffects）会挡住它。' },
  { term: 'SSR', en: 'Server Side Rendering', define: '在服务端生成 HTML，首屏不必等 JS 执行。', analogy: '外卖做好送来，而不是送食材让你自己做。', myth: '以为 SSR 一定更快；服务端渲染成本与缓存策略才是关键。' },
  { term: 'CDN', en: 'Content Delivery Network', define: '把静态资源放到离用户近的边缘节点。', analogy: '每个小区门口都有个快递柜。', myth: '以为接了 CDN 就快；缓存键与回源策略没配好反而更慢。' },
  { term: '反向代理', en: 'Reverse Proxy', define: '代理服务器接收请求再转发给内部服务。', analogy: '公司前台统一收件再分发到工位。', myth: '和正向代理混淆；正向代理代表客户端，反向代理代表服务端。' },
  { term: '灰度发布', en: 'Canary Release', define: '先让一小部分流量走新版本，观察后再全量。', analogy: '新菜先给一桌客人试吃。', myth: '以为按比例分流就够了；没有配套的监控与回滚等于裸奔。' },
  { term: '蓝绿部署', en: 'Blue-Green Deployment', define: '两套环境交替上线，切换在网关层完成。', analogy: '两间厨房轮着用，一间在营业另一间在装修。', myth: '以为切换是瞬时的；数据库 schema 兼容才是真难点。' },
  { term: 'SLA / SLO / SLI', en: 'Service Level', define: 'SLI 是度量指标，SLO 是目标值，SLA 是对外承诺。', analogy: 'SLI 是体温计，SLO 是 37 度，SLA 是请假条上的承诺。', myth: '把 SLO 当 SLA 对外承诺，会给自己挖坑。' },
  { term: '领域驱动', en: 'DDD', define: '按业务领域划分边界，而不是按技术分层。', analogy: '按科室分诊，而不是按「所有医生」和「所有护士」分。', myth: '以为 DDD 就是画一堆聚合根；核心是边界与语言统一。' },
  { term: '贫血模型', en: 'Anemic Domain Model', define: '对象只有属性没有行为，业务逻辑全在 Service 里。', analogy: '只有躯壳没有器官。', myth: '以为贫血一定错；简单 CRUD 场景它更划算。' },
  { term: '六边形架构', en: 'Hexagonal Architecture', define: '核心业务在中间，外部依赖通过端口适配器接入。', analogy: '插座标准化，插什么电器都行。', myth: '以为要多写很多层；目的是隔离变化，不是堆抽象。' },
  { term: '可观测性', en: 'Observability', define: '靠日志、指标、链路还原系统内部发生了什么。', analogy: '给系统做 CT，而不是只量体温。', myth: '以为装了监控就可观测；没有链路关联的日志等于没有。' },
  { term: '协程', en: 'Coroutine', define: '用户态调度的轻量线程，切换不需要内核参与。', analogy: '一个人同时看几口锅，水开了就处理哪口。', myth: '以为协程一定并行；单线程协程只是并发，不并行。' },
  { term: '限流', en: 'Rate Limiting', define: '按阈值丢弃或排队请求，保护系统不被压垮。', analogy: '景区限流入园。', myth: '以为限流越快越好；没有区分优先级的限流会先杀掉重要请求。' },
  { term: 'TTL', en: 'Time To Live', define: '数据或缓存的存活时间，到期失效。', analogy: '酸奶的保质期。', myth: '以为 TTL 精确到毫秒；Redis 过期是惰性 + 定期清理，不保证准点消失。' }
]

/* ========== 5. 共学房间 ========== */
export const STUDY_ROOMS = [
  { id: 'r1', name: '微服务落地共读', desc: '每周两章，读完各自贴一条踩坑记录', people: 32, progress: 42, tag: '共读', live: true },
  { id: 'r2', name: '前端 90 天打卡', desc: '每天一个小目标，缺卡可补，周末互评', people: 58, progress: 68, tag: '打卡', live: true },
  { id: 'r3', name: '面试题互测', desc: '每晚 21:00 语音对练，轮流当面试官', people: 14, progress: 25, tag: '对练', live: false }
]

/* ========== 6. 盲盒池 ========== */
export const DRAW_POOL = [
  { title: '用 EXPLAIN 看懂一次慢查询', kind: '动手', min: 8, hint: '打开任意一张表的执行计划，只看 type 和 rows 两列' },
  { title: '给一段代码加一个失败用例', kind: '动手', min: 6, hint: '先让它红，再让它绿，最后再重构' },
  { title: '画出你负责服务的调用链', kind: '白纸', min: 10, hint: '标出每个跨进程调用的超时和重试' },
  { title: '读一个开源项目的 README', kind: '阅读', min: 7, hint: '只回答三个问题：它解决什么、怎么用、有什么坑' },
  { title: '把一条业务规则写成测试', kind: '动手', min: 9, hint: '边界值至少覆盖两个' },
  { title: '复现一个线上报错', kind: '排错', min: 12, hint: '本地起最小可复现环境，比读十篇文章有用' },
  { title: '给一个方法去掉三层嵌套', kind: '重构', min: 6, hint: '卫语句先挡掉异常分支' },
  { title: '解释一个你每天都在用的注解', kind: '输出', min: 8, hint: '用一句话讲给不做后端的同事听' },
  { title: '量一次接口的真实耗时', kind: '动手', min: 10, hint: '分位而不是平均，P99 才有故事' },
  { title: '给项目补一条日志', kind: '动手', min: 5, hint: '能回答「谁在什么时候做了什么」就够了' },
  { title: '找一个可以删掉的依赖', kind: '清理', min: 7, hint: '删之前先全局搜引用' },
  { title: '把一个魔法数字变成常量', kind: '重构', min: 4, hint: '顺便写上它为什么是这个值' }
]
