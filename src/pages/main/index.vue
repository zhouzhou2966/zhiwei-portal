<!-- 首页 -->
<template>
  <div class="mainWrapper">
    <!-- 首屏：主视觉 + 热门专题 + 分类 chips
         深色块收在容器里（不再通栏铺满）：内容宽 1400、背景也 1400，
         两者同宽才不会出现「蓝色横贯整页、内容缩在中间」的割裂感 -->
    <section class="hero">
      <div class="container">
        <div class="heroCard">
          <div class="heroRow">
            <!-- 头部幻灯片 -->
            <Swiper :data="imags" class="heroStage"></Swiper>
            <!-- 热门专题（静态，不依赖登录态） -->
            <div class="topicCol">
              <TopicCard v-for="t in topics" :key="t.title" :topic="t"></TopicCard>
            </div>
          </div>

          <!-- 分类条：一级 + 二级全部平铺。
               原来左侧是固定 388px 高的分类竖栏，库里只有 2 个一级分类，下面 200 多 px 全是白板。 -->
          <div class="catChips">
            <span class="lb">课程分类</span>
            <template v-for="item in classCategorys" :key="item.id">
              <span class="chip main" @click="goCat('categoryIdLv1', item.id)">{{ item.name }}</span>
              <span
                class="chip"
                v-for="sub in item.children"
                :key="sub.id"
                @click="goCat('categoryIdLv2', sub.id)"
              >{{ sub.name }}</span>
            </template>
            <span class="all" @click="$router.push('/search/index')">全部分类 <i class="arrow"></i></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 兴趣模块（登录且已设置兴趣才显示） -->
    <div class="container" v-if="interest.size > 0">
      <Interest :data="interest" :key="intKey" @setInterest="setInterest"></Interest>
    </div>

    <!-- 免费好课：接口是 /ss/recommend/free，返回的全是免费课，
         原标题「新课推荐」和实际数据对不上，改成如实的名字 -->
    <div class="container">
      <OpenClass
        title="免费好课"
        subtitle="0 元入门，随到随学"
        :data="freeClassData"
      ></OpenClass>
    </div>

    <!-- 广告位（同样收进容器，跟首屏、课程区对齐） -->
    <div class="container">
      <div class="globalTopBanner">
        <img src="@/assets/adv.svg" alt="新专题上线" />
      </div>
    </div>

    <!-- 精品好课 -->
    <div class="container">
      <OpenClass
        title="精品好课"
        subtitle="按报名热度精选"
        badge="top"
        :data="goodClassData"
      ></OpenClass>
    </div>

    <!-- 精品新课 -->
    <div class="container">
      <OpenClass
        title="精品新课"
        subtitle="最近上架的课程"
        badge="new"
        :data="newClassData"
      ></OpenClass>
    </div>

    <!-- 兴趣选择设置 -- start -->
    <div class="interest">
      <el-dialog v-model="interestDialog" width="80%" :show-close="false">
        <template #header="{ close, titleId }">
          <div class="dialogHead fx-sb">
            <div>
              <span class="titleClass marg-rt-10">设置学习兴趣</span>
              <span class="ft-cl-des">打造你的专属在线学习平台</span>
            </div>
            <div class="butCont fx">
              <span class="bt-grey marg-rt-15" @click="close">下次再选</span>
              <span class="bt" @click="saveInterest">保存</span>
            </div>
          </div>
        </template>
        <CheckInterest :data="classCategorys" :initValue="interest" @setInterestList="setInterestList"></CheckInterest>
      </el-dialog>
    </div>
    <div class="floatCont">
      <router-link to="/main/coupon">
        <img src="@/assets/coup.png" alt="优惠券" />
      </router-link>
    </div>
  </div>
</template>
<script setup>
// errMsg：统一取后端错误提示（禁止写 res.data.msg —— 业务失败时响应体里没有 data 字段，见 utils/request.js）
import { errMsg } from '@/utils/request'
/** 数据导入 **/

import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { isLogin, dataCacheStore } from "@/store";
import { ElMessage } from "element-plus";
import { getClassCategorys, getRecommendClassList, setInterests, getInterests } from "@/api/class.js";
import CheckInterest from "./components/CheckInterest.vue";
import Interest from "./components/Interest.vue";
import OpenClass from "./components/OpenClass.vue";
import Swiper from "./components/Swiper.vue";
import TopicCard from "./components/TopicCard.vue";
import banner1 from "@/assets/banner1.svg";
import banner2 from "@/assets/banner2.svg";
import banner3 from "@/assets/banner3.svg";
const dataCache = dataCacheStore();
const router = useRouter();
// 分类数据
const classCategorys = ref([]);
// banner幻灯片图片
const imags = [banner1, banner2, banner3];
// 首屏右侧的热门专题：文案取自现有三张 banner 里的两个主题，纯静态，不走接口
const topics = [
  {
    tag: '热门专题',
    title: '系统架构演进实战',
    desc: '从单机到分布式，讲透每一次架构取舍',
    tone: 'navy'
  },
  {
    tag: '热门专题',
    title: '全链路项目实战',
    desc: '在完整项目中理解每个技术选型的原因',
    tone: 'gold'
  }
];
// 精品公开课的数据
const freeClassData = ref([]);
// 兴趣弹窗
const interestDialog = ref(false);
// 精品好课数据
const goodClassData = ref([]);
// 精品新课数据
const newClassData = ref([]);
// mounted生命周期
onMounted(async () => {
  // 获取三级分类信息
  getClassCategoryData();
  // 获取精品公开课
  getFreeClassListData();
  getGoodClassListData();
  getNewClassListData();
  // 获取兴趣列表 （二级分类）
  if (await isLogin()) {
    getInterestData();
  }
});

/** 方法定义 **/

// 分类跳转：type 与搜索页约定的取值一致
const goCat = (type, id) => {
  router.push({ path: '/search/index', query: { type, id } });
};

// 获取一、二、三级分类信息
const getClassCategoryData = async () => {
  await getClassCategorys()
    .then((res) => {
      if (res.code === 200) {
        classCategorys.value = res.data;
        dataCache.setCourseClassDataes(res.data)
      } else {
        ElMessage({
          message: errMsg(res),
          type: "error",
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "分类请求出错！",
        type: "error",
      });
    });
};
// 打开修改兴趣弹窗
const setInterest = (val) => {
  interestCatch.value = interest.value;
  interestDialog.value = val;
};
// 精品公开课接口 - 公开课取消
const getFreeClassListData = async () => {
  await getRecommendClassList("free")
    .then((res) => {
      if (res.code === 200) {
        freeClassData.value = Array.isArray(res.data) ? res.data : [];
      } else {
        ElMessage({
          message: errMsg(res),
          type: "error",
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "分类请求出错！",
        type: "error",
      });
    });
};
// 精品公开课接口
const getGoodClassListData = async () => {
  await getRecommendClassList('best')
    .then((res) => {
      if (res.code === 200) {
        goodClassData.value = Array.isArray(res.data) ? res.data : [];
      } else {
        ElMessage(res.meg);
      }
    })
    .catch(() => {
      ElMessage("分类请求出错！");
    });
};
// 新课推荐
const getNewClassListData = async () => {
  await getRecommendClassList('new')
    .then((res) => {
      if (res.code === 200) {
        newClassData.value = Array.isArray(res.data) ? res.data : [];
      } else {
        ElMessage(res.meg);
      }
    })
    .catch(() => {
      ElMessage({
        message: "分类请求出错！",
        type: "error",
      });
    });
};
// 保存设置的兴趣变量
const interest = ref(new Set());
const intKey = ref(1);
// 获取兴趣
const getInterestData = async () => {
  await getInterests()
    .then((res) => {
      if (res.code === 200) {
        // 后端可能返回 null（无数据），加数组守卫，避免 .length / new Set 抛异常
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length === 0) {
          interestDialog.value = true;
        }
        interest.value = new Set(list);
      } else {
        // 接口异常 ≠ 用户没设置兴趣：这里只报错，不弹「设置学习兴趣」引导框。
        // 否则任何服务挂掉都会伪装成业务引导，排查时被误导（2026-10-13 踩过）。
        console.error("兴趣列表获取失败：", res.msg);
        ElMessage({
          message: res.msg || "兴趣列表获取失败！",
          type: "error",
        });
      }
    })
    .catch(() => {
      ElMessage({
        message: "兴趣列表获取失败！",
        type: "error",
      });
    });
};

// 更改兴趣的时候记录
const interestCatch = ref(new Set());
const setInterestList = (list) => {
  interestCatch.value = list;
};

// 保存兴趣
const saveInterest = async () => {
  let str = "";
  for (let val of interestCatch.value) {
    if (typeof val == "string") {
      str == "" ? (str = val) : (str += `,${val}`);
    } else {
      str == "" ? (str = val.id) : (str += `,${val.id}`);
    }
  }
  if (str == "") {
    ElMessage({
      message: "您还没有选择兴趣，请先选择兴趣后再保存！",
      type: "success",
    });
    return;
  }
  await setInterests({ interestedIds: str })
    .then((res) => {
      if (res.code === 200) {
        ElMessage({
          message: "兴趣保存成功！",
          type: "success",
        });
        getInterestData();
        intKey.value++;
        interestDialog.value = false;
      } else {
        ElMessage({
          message: errMsg(res),
          type: "error",
        });
      }
    })
    .catch(() => { });
};
</script>
<style lang="scss" src="./index.scss">
</style>
