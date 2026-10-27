<!-- 登录页面 - 用户名密码登录 -->
<template>
  <div class="loginPass">
    <el-form
      ref="formRef"
      :model="fromData"
      :rules="rules"
      label-width="0px"
      class="demo-dynamic"
    >
      <el-form-item prop="username" label="">
        <el-input v-model="fromData.username" placeholder="请输入用户名或手机号" />
      </el-form-item>
      <el-form-item prop="password" label="">
        <el-input type="pass" :show-password="true" v-model="fromData.password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item class="marg-b-10">
        <div class="fx-sb">
            <div>
                <el-checkbox v-model="fromData.rememberMe" size="large">7天免登录</el-checkbox>
            </div>
            <div>找回密码</div>
        </div>
      </el-form-item>
      <el-form-item class="marg-bt-15">
        <div class="bt" @click="submitForm(formRef)">登 录</div>
      </el-form-item>
    </el-form>
    <div class="font-bt text-center" @click="goRegister">
        去注册
    </div>
  </div>
</template>
<script setup>
// 数据导入
import { reactive, ref } from "vue";
import { useRoute, useRouter } from 'vue-router'
import { userLogins, getUserInfo } from "@/api/user"
import { useUserStore } from '@/store'
import { ElMessage } from "element-plus";

const emit = defineEmits(['goHandle'])
const store = useUserStore();
const router = useRouter()
const route = useRoute()

/**
 * 登录成功后的落点：带 redirect 就回原页面（例如从购物车被挡下来的），否则回首页。
 * 原来一律 router.push('/main/index')，用户点购物车 → 登录 → 落到首页，还得自己再点一次购物车。
 * ⚠️ 只接受站内路径：必须以单个 `/` 开头。`//evil.com` 是协议相对地址，浏览器会当外站跳，
 *    不挡就是一个开放重定向。
 */
const goAfterLogin = () => {
  const redirect = route.query.redirect
  const isInnerPath = typeof redirect === 'string' && /^\/(?!\/)/.test(redirect)
  router.push(isInnerPath ? redirect : '/main/index')
}

const formRef = ref();
const checked = ref(false)
// 登录参数校验
const fromData = reactive({
  username: "",
  password: "",
  type: 1,
  // 「7天免登录」：勾选后 token 落 localStorage，且服务端下发 7 天有效期的 access-token
  rememberMe: false
});
// 校验规则
const rules = reactive({
  username: [
    { required: true, message: "请输入正确的用户名或手机号", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入正确的密码", trigger: "blur"},
  ],
});
// 登录
const submitForm = (formEl) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      // 提交登录
      await userLogins(fromData)
			.then(async res => {
				if (res.code === 200) {
          // 用户token写入 pinia
					store.setToken(res.data, fromData.rememberMe);
					// 获取用户信息
          const data = await getUserInfo()
          if (data.code === 200) {
              // 记录到store 并调转到首页
              store.setUserInfo(data.data)
					    // 登录后落点：有 redirect 回原页面，否则首页
              goAfterLogin()
          }
				} else {
          ElMessage({
              message: res.msg,
              type: 'error'
          });
				}
			})
			.catch(err => {
        ElMessage({
          message: err,
          type: 'error'
        });
      });
    } else {
      ElMessage({
          message: '登录出错，请重新尝试',
          type: 'error'
      });
      return false;
    }
  });
};

// 去注册
const goRegister = () => {
  emit('goHandle', 'register')
}
</script>
<style lang="scss" scoped>
.loginPass {
    margin-top: 40px;
}
</style>
