<!-- 主页面 -->
<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
// element-plus 2.14 的 exports 里 "./lib/*" 只挂了 require 条件，
// Vite 走 import 条件解析会直接报 "No known conditions"，必须用 es/ 这条。
import zhCn from "element-plus/es/locale/lang/zh-cn";
let locale = zhCn;
</script>
