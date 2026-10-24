<!-- 个人中心 - 学习计划表 -->
<template>
  <div class="planTable" v-if="data && data.length">
    <!-- 换成原生 table 而不是 el-table：
         ① 静态稿的表头是圆角浅底块、末列右对齐，el-table 的默认表头是通栏灰线，改起来要一路穿透；
         ② 这里只有 5 列纯展示，没有排序/选择/固定列，用不上 el-table 的能力，
            反而多一层 .el-table__body-wrapper 的固定高度，1 条数据时下面空一大片。 -->
    <table class="tbl">
      <thead>
      <tr>
        <th style="width:32%">课程</th>
        <th style="width:22%">本周进度</th>
        <th style="width:22%">课程进度</th>
        <th style="width:14%">学习时间</th>
        <th style="width:10%">操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="row in data" :key="row.courseId || row.id">
        <td class="cname" :title="row.courseName">{{ row.courseName }}</td>
        <td>
          <div class="miniBar">
            <div class="bar"><i :style="{width: weekPercent(row) + '%'}"></i></div>
            <span>{{ row.weekLearnedSections || 0 }} / {{ row.weekFreq || 0 }}</span>
          </div>
        </td>
        <td>
          <div class="miniBar">
            <div class="bar"><i :style="{width: coursePercent(row) + '%'}"></i></div>
            <span>{{ learnedShow(row) }} / {{ row.sections || 0 }}</span>
          </div>
        </td>
        <td class="muted">{{ formatLearnTime(row.latestLearnTime) || '—' }}</td>
        <td><span class="linkBtn" @click="goLearn(row)">去学习</span></td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- 没有计划时留白会让人以为表格没加载出来，给一句话 -->
  <div class="planEmpty" v-else>
    还没有学习计划，去 <span class="linkBtn" @click="$router.push({name: 'myClassAll'})">全部课程</span> 里给课程定个每周目标
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { formatLearnTime } from '../formatLearnTime'

defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const goLearn = (row) => router.push({path: '/learning/index', query: {id: row.courseId}})

// 分母为 0 时直接给 0，否则 NaN% 会让进度条整条消失
const ratio = (a, b) => {
  const total = Number(b) || 0
  const cur = Number(a) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round(cur / total * 100))
}
const weekPercent = row => ratio(row.weekLearnedSections, row.weekFreq)
const coursePercent = row => ratio(row.learnedSections, row.sections)

// 文字也要封顶，理由同 ClassGridCard：后端 learnedSections 是学习记录条数，
// 课程改过大纲之后会出现「已学 24 / 12 节」，看着像数据错乱。
// 注意只封「课程进度」这一列 —— 「本周进度」那列是「实际完成 / 目标」，
// 超额完成（4 / 1）是真实情况，封顶反而把信息抹掉了。
const learnedShow = row => {
  const total = Number(row && row.sections) || 0
  const learned = Number(row && row.learnedSections) || 0
  return total > 0 ? Math.min(learned, total) : learned
}
</script>
<style lang="scss" scoped>
.tbl{
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  thead th{
    padding: 11px 16px;
    background: var(--color-background5);
    font-size: 13px;
    font-weight: 400;
    color: var(--color-font2);
    text-align: left;
    &:first-child{
      border-radius: 8px 0 0 8px;
    }
    &:last-child{
      border-radius: 0 8px 8px 0;
      text-align: right;
      white-space: nowrap;
    }
  }
  tbody tr{
    transition: background-color .2s;
    &:hover{
      background: var(--color-background5);
    }
    &:last-child td{
      border-bottom: none;
    }
  }
  tbody td{
    padding: 16px;
    border-bottom: 1px solid var(--color-background2);
    &:last-child{
      text-align: right;
      white-space: nowrap;
    }
  }
  .cname{
    font-weight: 500;
    color: var(--color-font1);
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .muted{
    color: var(--color-font2);
    white-space: nowrap;
  }
}
.miniBar{
  display: flex;
  align-items: center;
  gap: 10px;
  .bar{
    width: 88px;
    height: 5px;
    border-radius: 3px;
    background: var(--color-background2);
    overflow: hidden;
    flex: none;
  }
  .bar > i{
    display: block;
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--color-hover), var(--color-main));
  }
  span{
    font-size: 13px;
    color: var(--color-font2);
    white-space: nowrap;
  }
}
.linkBtn{
  font-size: 14px;
  color: var(--color-main);
  cursor: pointer;
  transition: color .2s;
  &:hover{
    color: var(--color-hover);
  }
}
.planEmpty{
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-font2);
}
</style>
