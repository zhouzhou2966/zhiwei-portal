<!-- 注册页面 -->
<template>
  <div class="loginPass">
    <el-form
      ref="formRef"
      :model="fromData"
      :rules="rules"
      label-width="0px"
      class="demo-dynamic"
    >
      <el-form-item prop="cellPhone" label="">
        <el-input v-model="fromData.cellPhone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item prop="password" label="">
        <el-input v-model="fromData.password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item prop="code" label="">
        <div class="fx-sb">
          <el-input v-model="fromData.code" maxlength="6" placeholder="请确认短信验证码" />
          <span class="bt bt-grey" @click="verifycodeHandle">
            {{ codeCountdown > 0 ? codeCountdown + 's 后重发' : '发送验证码' }}
          </span>
        </div>
        <div v-if="echoedCode" class="code-tip">
          演示环境短信通道未接通，本次验证码：<b>{{ echoedCode }}</b>
        </div>
      </el-form-item>
      <el-form-item class="marg-bt-15">
        <div class="bt" :class="{ 'bt-disabled': submitting }" @click="submitForm(formRef)">
          {{ submitting ? '提交中…' : '注册' }}
        </div>
      </el-form-item>
    </el-form>
    <div class="font-bt text-center" @click="goLogin()">
        去登录
    </div>
  </div>
</template>
<script setup>
import { onUnmounted, reactive, ref } from "vue";
import { useRouter } from 'vue-router'
import { userRegist, verifycode } from "@/api/user"
import { useUserStore } from '@/store'
import { ElMessage } from "element-plus";

const store = useUserStore();
const router = useRouter()

const emit = defineEmits(['goHandle'])
// 登录数据初始化
const formRef = ref();
const fromData = reactive({
  cellPhone: "",
  password: "",
  code: ""
});
// 手机号校验
const verifyPone = (rull, value, callback) => {
  const reg = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/
  if (value == '') {
    callback(new Error('请输入手机号'));
  } else if(!reg.test(value)){
    callback(new Error('请输入正确的手机号'));
  }
  callback()
}
// 校验
const rules = reactive({
  cellPhone: [
    { validator: verifyPone, trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur"},
  ],
  code: [
    { required: true, message: "请输入短信验证码", trigger: "blur"},
  ],
});
// 注册提交中标记。
// 为什么需要：注册按钮没有原生 disabled 语义，用户连点会连续发 N 个请求，
// 第一笔成功后验证码已被消费，后续请求全部以「验证码错误」收场，体验莫名其妙。
const submitting = ref(false)
// 验证码倒计时（与「个人设置-安全设置」用同一套写法）
const codeCountdown = ref(0)
// 演示环境后端会把验证码回显在 data 里（短信通道 AK 已清空，真机收不到）
const echoedCode = ref('')
let codeTimer = null

const startCountdown = () => {
  codeCountdown.value = 60
  clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
}
// 发送验证码
const verifycodeHandle = async() => {
  // 冷却期内点击直接忽略（后端 SETNX 也会拦，这里只是省一次请求）
  if (codeCountdown.value > 0) return
  const reg = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/
  if (fromData.cellPhone == "" || !reg.test(fromData.cellPhone)){
    ElMessage({
              message: '请输入正确的手机号',
              type: 'error'
          });
    return 
  }
  try {
    const res = await verifycode({cellPhone: fromData.cellPhone})
    if (res.code == 200) {
      // 演示环境 data 里带验证码，直接显示出来，否则这个页面根本演示不了
      if (res.data) {
        echoedCode.value = res.data
        ElMessage({ message: `演示环境验证码：${res.data}`, type: 'info', duration: 8000 })
      } else {
        ElMessage({ message: '验证码发送成功', type: 'success' })
      }
      startCountdown()
    } else {
      // 60 秒冷却期内重复点会走到这里（后端 SETNX 拒绝）
      ElMessage({ message: res.msg, type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: '验证码发送失败，请稍后重试', type: 'error' })
  }
}
// 注册
const submitForm = (formEl) => {
  if (!formEl) return;
  // 防重复提交：提交中直接忽略后续点击
  if (submitting.value) return;
  formEl.validate( async (valid) => {
    if (valid) {
      submitting.value = true
      // 提交注册
      await userRegist(fromData)
      .then(async res => {
        if (res.code == 200) {
          ElMessage({
                message: '注册成功！请登录',
                type: 'success'
            });
            setTimeout(() => {
              emit('goHandle', 'pass')
            }, 500)
        } else {
            ElMessage({
                message: res.msg,
                type: 'error'
            });
        }
      })
      .catch(err => {})
      .finally(() => {
        submitting.value = false
      })
    }
  });
};
// 去登录
const goLogin = () => {
  emit('goHandle', 'pass')
}
// 组件卸载时清掉定时器，避免切走后还在后台跑
onUnmounted(() => {
  clearInterval(codeTimer)
  codeTimer = null
})
</script>
<style lang="scss" scoped>
.loginPass {
    margin-top: 40px;
        .fx-sb .bt{
            position: absolute;
            width: 80px;
            height: 28px;
            line-height: 28px;
            font-size: 14px;
            right: 10px;
            top: 6px;
        }
        .bt-disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    .code-tip {
      font-size: 12px;
      line-height: 20px;
      color: var(--color-font2);
      b { color: var(--color-main); }
    }
}
</style>
