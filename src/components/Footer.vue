<!-- 公用底部组件 · v40 壳层
     视觉对照 prototype/redesign.html 的 footer：淡深蓝 #31648A 通栏，
     链接行 + 元信息行（品牌字标在右）。链接保持原占位行为（点击不跳转）。 -->
<template>
  <footer>
    <div class="container">
      <div class="flinks">
        <span v-for="item in Links" :key="item.title" @click="goDetails(item.link)">{{ item.title }}</span>
      </div>
      <div class="fmeta">
        <div class="info">
          <p>知微致力于让每一次学习都见微知著，与优秀的内容创作者一起，把知识讲到心里去</p>
          <p>&#169; 2026 知微 ZHIWEI ACADEMY 保留所有权利</p>
        </div>
        <div class="brand">知微<em>ZHIWEI</em></div>
      </div>
    </div>
  </footer>
</template>
<script setup>
// 站内-友情链接
const Links = [
  { title: '关于我们', link: '/' },
  { title: '管理团队', link: '/' },
  { title: '工作机会', link: '/' },
  { title: '客户服务', link: '/' },
  { title: '帮助文档', link: '/' },
  { title: '如何注册', link: '/' },
  { title: '如何选课', link: '/' },
  { title: '合作机构', link: '/' },
  { title: '合作导师', link: '/' }
]
// 转入详情页
const goDetails = (link) => {
  return false
}
</script>
<style lang="scss" scoped>
footer {
  margin-top: 56px;
  width: 100%;
  background: #31648a;
  color: rgba(243, 238, 226, 0.85);
  text-align: left;
}

.container {
  width: min(1280px, calc(100% - 80px));
  margin: 0 auto;
}

.flinks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 30px;
  padding: 30px 0 16px;
  font-size: 13px;

  span {
    cursor: pointer;
    color: rgba(243, 238, 226, 0.78);
    transition: color 0.15s;

    &:hover {
      color: #fff;
    }
  }
}

.fmeta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 0 24px;
  border-top: 1px solid rgba(243, 238, 226, 0.18);

  .info {
    font-size: 12px;
    color: rgba(243, 238, 226, 0.5);
    line-height: 1.9;

    p {
      margin: 0;
    }
  }

  .brand {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #fff;

    em {
      font-family: var(--font-serif);
      font-size: 10px;
      font-style: normal;
      letter-spacing: 1.2px;
      color: rgba(243, 238, 226, 0.55);
      margin-left: 6px;
    }
  }
}
</style>
