<!-- 首页-兴趣推荐模块
     结构：兴趣 tab → 一张「为你推荐」大卡（封面 | 信息 | 价格区）。
     和原来的区别：
     1. 不再把课程封面当背景铺满再往上叠字 —— 封面里本来就印着课程大字，
        叠一层标题会打架（截图里「JavaEE极速就业班」和「java泛型」重在一起）。
        现在封面是独立的一块，正常显示，文字全部在右侧白底上。
     2. 不再用「右侧固定高度课程列表」—— 该兴趣下只有 1 门课时，那一列会空掉 2/3。
        改成底部一排可切换的胶囊，1 门课时自动隐藏。
     3. 价格和报名按钮单独一个竖条（浅米底），把右侧的空白用掉。 -->
<template>
  <div class="Interest">
    <div class="intHead">
      <div class="tabs">
        <span
          v-for="item in tabList"
          :key="item.id"
          class="tab"
          :class="{ act: actId === item.id }"
          @click="checkHandle(item.id)"
        >{{ item.name }}</span>
      </div>
      <div class="edit" @click="changeHandle">
        <i class="iconfont zhy-a-icon_xiugai22x"></i>
        修改兴趣
      </div>
    </div>

    <div class="intCard" v-if="teacherInfo && teacherInfo.id">
      <!-- 封面：独立一块，正常显示，不叠任何文字 -->
      <div class="cover" @click="goDetails(teacherInfo.id)">
        <img v-if="teacherInfo.coverUrl" :src="teacherInfo.coverUrl" :alt="teacherInfo.name" />
        <div class="ph" v-else>{{ initial }}</div>
      </div>

      <!-- 信息区 -->
      <div class="info">
        <span class="tag">为你推荐</span>
        <h3 class="name" @click="goDetails(teacherInfo.id)">{{ teacherInfo.name }}</h3>
        <div class="meta">
          <img class="avatar" :src="teacherInfo.icon || '/avatar-default.svg'" alt="" />
          <span>{{ teacherInfo.teacher || '匿名讲师' }}</span>
          <i class="dot"></i>
          <span>共 {{ teacherInfo.sections || 0 }} 节</span>
          <i class="dot"></i>
          <span>{{ teacherInfo.sold || 0 }} 人在学</span>
        </div>

        <!-- 同分类可切换：只有 1 门课时整排不渲染，避免留一条空胶囊 -->
        <div class="switch" v-if="classList.length > 1">
          <span
            v-for="(item, i) in classList"
            :key="item.id"
            :class="{ act: teacherInfo.id === item.id }"
            @mouseenter="teacherInfo = item"
            @click="goDetails(item.id)"
          >
            <em>{{ String(i + 1).padStart(2, '0') }}</em>{{ item.name }}
          </span>
        </div>
      </div>

      <!-- 价格区 -->
      <div class="side">
        <span class="price" :class="{ free: isFree }">{{ priceText }}</span>
        <span class="cta" @click="goDetails(teacherInfo.id)">立即报名</span>
      </div>
    </div>

    <div class="nodata" v-else>
      <span class="dot"></span>
      该兴趣分类下暂无课程
    </div>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getClassList } from "@/api/class.js";
import { ElMessage } from "element-plus";
// 引入父级传参
const props = defineProps({
  data: {
    type: Set,
    default: () => new Set(),
  },
});
const emit = defineEmits(["setInterest"]);

const router = useRouter();

// tab 数据：props.data 是 Set，模板里直接遍历 Set 拿不到稳定顺序，先转数组
const tabList = computed(() => [...props.data]);

// 当前兴趣课程 - 默认展示选中
const actId = ref();
// 课程讲师信息
const teacherInfo = ref({});
const classList = ref([]);

// 价格按「分」转「元」；Number(undefined) 是 NaN，先兜成 0
const isFree = computed(() => (Number(teacherInfo.value.price) || 0) === 0)
const priceText = computed(() =>
  isFree.value ? '免费' : `￥${((Number(teacherInfo.value.price) || 0) / 100).toFixed(2)}`
)
const initial = computed(() => (teacherInfo.value.name || '课').trim().charAt(0))

const goDetails = (id) => {
  if (!id) return
  router.push({ path: '/details', query: { id } })
}

// 初始化首选项并获取其课程数据
onMounted(() => {
  const data = [...props.data];
  if (!data.length) return;
  actId.value = data[0].id;
  // 通过二级分类id 获取对应课程列表
  getClassListData(actId.value);
});

// 点击切换效果
const checkHandle = (id) => {
  actId.value = id;
  getClassListData(id);
};

// 打开修改兴趣弹窗
const changeHandle = () => {
  emit("setInterest", true);
};
// 通过二级分类id 获取对应课程列表
const getClassListData = async (id) => {
  await getClassList(id)
    .then((res) => {
      if (res.code == 200) {
        // 后端无数据时返回 null，不兜底的话 classList.length / [0] 会直接抛异常
        const list = Array.isArray(res.data) ? res.data : [];
        classList.value = list;
        teacherInfo.value = list[0] || {};
      } else {
        ElMessage({
          message: errMsg(res),
          type: "error",
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "课程列表数据获取失败",
        type: "error",
      });
    });
};
</script>
<style lang="scss" scoped>
.Interest {
  margin-bottom: 46px;

  .intHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .tabs {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tab {
      padding: 6px 16px;
      font-size: 14px;
      color: var(--color-font2);
      border-radius: 999px;
      background: var(--color-background1);
      cursor: pointer;
      transition: color .18s, background .18s;

      &:hover {
        color: var(--color-main);
      }

      &.act {
        color: #fff;
        background: var(--color-main);
      }
    }

    .edit {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--color-font3);
      cursor: pointer;
      transition: color .18s;

      &:hover {
        color: var(--color-main);
      }

      .iconfont {
        font-size: 14px;
      }
    }
  }

  .intCard {
    display: flex;
    height: 250px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #EDE7DB;
    border-radius: 14px;
  }

  .cover {
    position: relative;
    flex: 0 0 34%;
    min-width: 0;
    background: linear-gradient(135deg, #E5EDF2, #C8D8E2);
    cursor: pointer;
    overflow: hidden;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .45s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }

    .ph {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 56px;
      font-weight: 600;
      color: rgba(27, 75, 107, .25);
    }
  }

  .info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
    padding: 24px 26px;
  }

  .tag {
    align-self: flex-start;
    padding: 2px 10px;
    font-size: 12px;
    color: #B07D1E;
    border-radius: 6px;
    background: rgba(217, 164, 65, .12);
  }

  .name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    margin: 12px 0 10px;
    font-size: 24px;
    font-weight: 600;
    line-height: 34px;
    color: var(--color-font1);
    cursor: pointer;

    &:hover {
      color: var(--color-main);
    }
  }

  .meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: var(--color-font3);

    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #C8C2B6;
    }
  }

  // 同分类切换：横向一排胶囊，课程多了也不会把卡片撑高
  .switch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 18px;
    padding-bottom: 2px;
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 0;
    }

    span {
      display: flex;
      align-items: center;
      flex: none;
      max-width: 200px;
      padding: 5px 12px;
      font-size: 12px;
      color: var(--color-font2);
      border-radius: 999px;
      background: var(--color-background1);
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      transition: color .18s, background .18s;

      em {
        margin-right: 6px;
        font-style: normal;
        font-weight: 600;
        color: var(--color-background4);
      }

      &:hover,
      &.act {
        color: var(--color-main);
        background: var(--color-main-light);

        em {
          color: #D9A441;
        }
      }
    }
  }

  .side {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 200px;
    gap: 14px;
    background: var(--color-background5);
    border-left: 1px solid #F1ECE1;

    .price {
      font-size: 26px;
      font-weight: 600;
      color: var(--color-error);

      &.free {
        font-size: 22px;
        color: #B07D1E;
      }
    }

    .cta {
      padding: 9px 26px;
      font-size: 14px;
      color: #fff;
      border-radius: 999px;
      background: var(--color-main);
      cursor: pointer;
      transition: background .18s;

      &:hover {
        background: var(--color-hover);
      }
    }
  }

  .nodata {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 200px;
    font-size: 14px;
    color: var(--color-font3);
    border: 1px dashed #E0D6C3;
    border-radius: 14px;

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #D9A441;
    }
  }
}
</style>
