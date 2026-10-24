<!-- 个人设置 -->
<template>
  <div class="mySetWrapper content">
    <CardsTitle class="marg-bt-40" title="个人设置" />
    <TableSwitchBar :data="tabData" @changeTable="checkHandle"></TableSwitchBar>  
    <div v-if="act == 0" class="fx-sb pd-tp-30">
      <div>
        <div class="fx">
          <!-- 一期先不加  放到二期 -->
          <!-- <div class="item fx">
            <span class="lab">账号：</span><el-input v-model="input" placeholder="请输入内容"></el-input>
          </div> -->
          <div class="item fx">
            <span class="lab">昵称：</span> <el-input v-model="user.name" placeholder="请输入内容"></el-input>
          </div>
        </div>
        <div class="item fx">
          <span class="lab">性别：</span>
          <el-radio-group class="radioGroup" v-model="user.gender">
            <el-radio :label="0">男</el-radio>
            <el-radio :label="1">女</el-radio>
          </el-radio-group>
        </div>
        <div class="item fx">
          <div class="bt" @click="updateUserInfoHandle">更新信息</div>
        </div>
      </div>
      <div>
        <el-upload
          class="avatar-uploader"
          :action="actions"
          :show-file-list="false"
          :http-request="httpRequest"
          :on-success="handleAvatarSuccess"
          >
          <img v-if="imageUrl" :src="imageUrl" class="avatar">
          <!-- 默认头像用内联 style 引用 public 根目录的绝对路径：写在 SCSS 里会被 Vite 按 base:'./'
               改写成 ./avatar-default.svg，而 CSS 产物在 /assets/ 下，线上必然 404 -->
          <i v-else class="el-icon-plus avatar-uploader-icon" :style="{backgroundImage: `url(${defaultAvatar})`}"></i>
          <div class="uploadBut"><span>上传头像</span></div>
        </el-upload>
      </div>
    </div>
    <div v-else class="set pd-tp-30">
      <!--
        三行都读「真实数据」（store 里的 /users/me 结果），不再是写死的假手机号和假邮箱。
        注意「当前密码强度」不能真的显示：库里存的是 BCrypt 哈希，
        从哈希反推强度在数学上不成立，硬显示一个值就是编数据。
        所以这里只显示「已设置」，强度提示挪到「修改密码」弹窗里对「新密码」实时算。
      -->
      <div class="line fx-sb">
        <div><span>登录密码</span> 已设置</div>
        <span class="font-bt" @click="openPwDialog">修改</span>
      </div>
      <div class="line fx-sb">
        <div><span>绑定手机</span> 已绑定手机：{{ maskedPhone }}</div>
        <span class="font-bt" @click="openPhoneDialog">修改</span>
      </div>
      <div class="line fx-sb">
        <div><span>绑定邮箱</span> 已绑定邮箱：{{ contactEmail }}</div>
        <span class="font-bt" @click="openEmailDialog">{{ hasEmail ? '去解绑' : '去绑定' }}</span>
      </div>
    </div>

    <!-- 修改登录密码 -->
    <el-dialog v-model="pwDialogVisible" title="修改登录密码" width="440px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="当前密码">
          <el-input v-model="pwForm.oldPassword" type="password" show-password placeholder="请输入当前登录密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <div class="mySet-field">
            <el-input v-model="pwForm.password" type="password" show-password maxlength="20" placeholder="6-20 位，建议字母+数字+符号" />
            <div v-if="pwStrength.text" class="mySet-pw-strength">
              密码强度：<b :style="{ color: pwStrength.color }">{{ pwStrength.text }}</b>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwForm.confirmPassword" type="password" show-password maxlength="20" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="pwDialogVisible = false">取消</div>
          <div class="bt" @click="submitPassword">{{ pwSubmitting ? '提交中…' : '确定' }}</div>
        </span>
      </template>
    </el-dialog>

    <!-- 更换绑定手机 -->
    <el-dialog v-model="phoneDialogVisible" title="更换绑定手机" width="460px" :close-on-click-modal="false" @closed="onPhoneDialogClosed">
      <el-form label-width="90px">
        <el-form-item label="当前手机">
          <span class="mySet-tip">{{ maskedPhone }}</span>
        </el-form-item>
        <el-form-item label="新手机号">
          <el-input v-model="phoneForm.cellPhone" maxlength="11" placeholder="请输入 11 位手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="mySet-field mySet-code-row">
            <el-input v-model="phoneForm.code" maxlength="6" placeholder="请输入短信验证码" />
            <div class="bt bt-grey mySet-code-btn" @click="sendCodeHandle">
              {{ codeCountdown > 0 ? codeCountdown + 's 后重发' : '获取验证码' }}
            </div>
          </div>
        </el-form-item>
      </el-form>
      <div v-if="echoedCode" class="mySet-tip">
        演示环境短信通道未接通，本次验证码：<b>{{ echoedCode }}</b>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="phoneDialogVisible = false">取消</div>
          <div class="bt" @click="submitPhone">{{ phoneSubmitting ? '提交中…' : '确定' }}</div>
        </span>
      </template>
    </el-dialog>

    <!-- 绑定 / 解绑邮箱 -->
    <el-dialog v-model="emailDialogVisible" title="绑定邮箱" width="440px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="邮箱">
          <el-input v-model="emailForm.email" placeholder="留空并确定 = 解绑邮箱" />
        </el-form-item>
      </el-form>
      <div class="mySet-tip">当前：{{ contactEmail }}</div>
      <template #footer>
        <span class="dialog-footer">
          <div class="bt bt-grey" @click="emailDialogVisible = false">取消</div>
          <div class="bt" @click="submitEmail">{{ emailSubmitting ? '提交中…' : '确定' }}</div>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>

/** 数据导入 **/
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import {
  updateUserInfo, getUserInfo,
  updatePassword, sendCode, updatePhone, updateEmail
} from "@/api/user.js";
import { errMsg, catchMsg } from "@/utils/request.js";
import { useUserStore } from "@/store"
import { getToken } from "@/utils/authToken"
import proxy from '@/config/proxy';


// 组件导入
import CardsTitle from "./components/CardsTitle.vue";
import TableSwitchBar from "@/components/TableSwitchBar.vue";

const store = useUserStore()
const userInfo = ref(store.getUserInfo)

/**
 * 401 且刷新 token 失败时，request.js 的拦截器不是 reject，而是**直接 return true**
 * （因为它要先弹「重新登录」再放行，让调用方继续跑）。
 * 那个 true 不是响应体，`true.code` / `true.msg` 全是 undefined，
 * 于是每个 `res.code != 200 → 弹错误` 的分支都会打出一条「兜底文案」的假报错，
 * 和已经弹出的登录框叠在一起（2026-10-23 验证时在 /users/me 上复现）。
 * 所有「拿到 res 之后判 code」的地方都要先过这道闸。
 */
const isHandledByInterceptor = (res) => !res || typeof res !== 'object'



const env = import.meta.env.MODE || "development"
// proxy 里只有 development / test / product 三个 key，而 vite build 时 import.meta.env.MODE 是 'production'，
// 原来写 proxy[env].host 会取到 undefined 再读 .host → 线上个人设置页 setup 直接抛 TypeError、整页白屏。
// 兜底到正式环境，和 utils/request.js 的 (proxy[env] || ...) 写法保持一致。
const actions = (proxy[env] || proxy.product).host+'/ms/files'
const tabData = [
  {id: 0, name: '基本信息'},
  {id: 1, name: '安全设置'}
]
// 切换基本信息和安全设置
const act = ref(0)
const checkHandle = val => {
  act.value = val
}
// 更新信息的参数
const user = reactive({
  name: userInfo.value.name,
  icon: userInfo.value.icon,
  gender: userInfo.value.gender || 0
})
// 图片上传
const imageUrl = ref(user.icon)
// 默认头像：public 根目录的静态文件，模板里内联引用（原因见模板注释）
const defaultAvatar = '/avatar-default.svg'

/**
 * 自定义上传：el-upload 默认的 action + headers 模式有两个坑 ——
 *   1) headers 在 setup 期求值，是 {authorization: store.getToken} 的「快照」，
 *      token 续期/失效后它不会更新，于是会一直拿旧 token 去传（表现为莫名 401）；
 *   2) el-upload 自己发请求，不走 axios 拦截器 —— 401 时不会弹「重新登录」，
 *      用户只看到静默失败，不知道发生了什么。
 * 改成 http-request 后，token 在「请求那一刻」实时读取，HTTP 状态与业务码也都能自己接管。
 */
const httpRequest = async ({ file }) => {
  const formData = new FormData()
  formData.append('file', file)
  let res
  try {
    res = await axios.post(actions, formData, {
      headers: { authorization: getToken() || '' }
    })
  } catch (e) {
    // 401：凭据失效（el-upload 不走 axios 拦截器，不会自动弹「重新登录」，这里必须自己提示）
    if (e.response && e.response.status === 401) {
      ElMessage({ message: '登录已过期，请重新登录', type: 'error' })
    } else {
      ElMessage({ message: '图片上传出错，请联系管理员', type: 'error' })
    }
    throw e
  }
  // 后端统一响应体：{code, msg, data}，200 才算成功
  if (res.data && res.data.code === 200) {
    // ⚠️ 不要在这里手动调 onSuccess —— el-upload 对 Promise 返回值会自己 .then(onSuccess, onError)，
    //    手动调一次 + 返回 resolve 会导致 handleAvatarSuccess(undefined) 二次触发而报错。
    //    所以成功就 return 响应体，失败就 throw，由 el-upload 统一分发。
    return res.data
  }
  ElMessage({ message: res.data?.msg || '图片上传出错，请联系管理员', type: 'error' })
  throw new Error(res.data?.msg || 'upload failed')
}

function handleAvatarSuccess(res, file) {
  if (res.code == 200) {
    imageUrl.value = URL.createObjectURL(file.raw);
    user.icon = res.data.path
    // 上传成功立刻落库 —— 否则刷新页面又读回旧 icon，表现就是「头像变回去了」
    saveAvatar(res.data.path)
  } else {
    ElMessage({
      message: '图片上传出错，请联系管理员',
      type: 'error'
    })
  }
}

/**
 * 只提交 icon 字段把新头像存下来。
 * 后端 updateById 只更新非 null 字段，所以这里不会顺带覆盖用户正在编辑的昵称/性别
 * （那两项仍由「更新信息」按钮统一提交）。
 */
async function saveAvatar(path) {
  try {
    const res = await updateUserInfo({ icon: path })
    if (isHandledByInterceptor(res)) return
    if (res.code == 200) {
      // 同步 store，顶部头像不用刷新就跟着变
      const ui = { ...(store.getUserInfo || {}), icon: path }
      store.setUserInfo(ui)
      userInfo.value = ui
      user.icon = path
      ElMessage({ message: '头像已更新', type: 'success' })
    } else {
      ElMessage({ message: errMsg(res, '头像保存失败'), type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: catchMsg(e, '头像保存失败'), type: 'error' })
  }
}

// 提交更新信息
const updateUserInfoHandle = async () => {
  let res
  try {
    res = await updateUserInfo(user)
  } catch (e) {
    ElMessage({ message: catchMsg(e, '更新失败'), type: 'error' })
    return
  }
  if (isHandledByInterceptor(res)) return
  if (res.code != 200) {
    // 原来写的是 res.data.msg —— 业务失败时响应体里没有 data 字段，直接 TypeError 被下面 catch 吞成「请求出错！」
    ElMessage({ message: errMsg(res, '更新失败'), type: 'error' })
    return
  }
  // 从新获取当前登录用户的信息
  // ⚠️ 必须单独 try：更新已经成功了，这一步失败只是「页面显示的不是最新」，
  //    原来它和更新共用同一个 catch，一旦 /users/me 抖一下就会提示「请求出错！」，
  //    用户会以为没保存成功，再点一次 —— 而实际上早就落库了。
  let data
  try {
    data = await getUserInfo()
  } catch (e) {
    ElMessage({ message: catchMsg(e, '信息已更新，但页面刷新失败，请手动刷新'), type: 'warning' })
    return
  }
  if (isHandledByInterceptor(data) || data.code != 200 || !data.data) {
    // 原来这里什么都不做 —— 点了「更新信息」既没成功提示也没失败提示，像是没反应
    ElMessage({ message: '信息已更新，但页面刷新失败，请手动刷新', type: 'warning' })
    return
  }
  // 记录到store —— 全站读 store 的地方（顶部 Header 的头像/昵称、问答/笔记的作者信息）
  // 现在都是 computed 直连 store，这里一写就全部自动更新，不需要重载页面。
  store.setUserInfo(data.data)
  userInfo.value = data.data
  // 同步表单：保证「服务端存的」和「页面显示的」一致（比如昵称被后端 trim 过）
  user.name = data.data.name
  user.icon = data.data.icon
  // gender 必须用 ?? 而不是 ||：0（男）是合法值但 falsy，用 || 会被后端返回的 null 顶掉
  user.gender = data.data.gender ?? user.gender
  if (data.data.icon) imageUrl.value = data.data.icon
  ElMessage({ message: '更新成功', type: 'success' })
  // ⚠️ 原来这里是 router.go(0)（整页刷新）。它的历史作用是「重载页面让顶部头像/昵称刷新」，
  // 属于治标：Header 现在用 computed 直连 store，store 一改模板就自动变。
  // 留着它反而有三个代价 —— 整个 SPA 重新下载解析（白屏闪烁）、
  // 顺带重发一串首屏请求（GET /ls/lessons/now、/cs/categorys/all…）、当前 tab 被打回「基本信息」。
};

/* ==================== 安全设置 ==================== */

const PHONE_RE = /^1[3-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 手机号 / 邮箱一律以 store 为准（computed 直连，别处 setUserInfo 后这里自动更新）。
// 不要在 setup 期把 store.getUserInfo 拷进普通对象 —— 那是「快照」，
// 换绑成功后页面不会变，得刷新才看得到（本项目在 Header.vue 上踩过同一个坑）。
const maskedPhone = computed(() => {
  const phone = (store.getUserInfo?.cellPhone || '').trim()
  if (!phone) return '未绑定'
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone
})
const contactEmail = computed(() => (store.getUserInfo?.email || '').trim() || '未绑定')
const hasEmail = computed(() => !!(store.getUserInfo?.email || '').trim())

// 拉一次最新的用户信息。store 是持久化的，可能停留在旧值上（比如在别的设备换过邮箱）。
// 失败必须给提示：手机号/邮箱都以 store 为准，这里静默失败的话页面会一直显示旧值，
// 用户刚换完号却发现「已绑定手机」没变，会以为换绑没成功。
const refreshUserInfo = async () => {
  let res
  try {
    res = await getUserInfo()
  } catch (e) {
    // catchMsg 返回空串 = 拦截器已经弹过「重新登录」，别再叠一条
    const msg = catchMsg(e, '账号信息获取失败，请刷新页面重试')
    if (msg) ElMessage({ message: msg, type: 'error' })
    return
  }
  if (res && res.code == 200 && res.data) {
    store.setUserInfo(res.data)
    userInfo.value = res.data
    return
  }
  // 401 刷新失败时 res 是 true（拦截器已弹登录框），别再叠一条业务失败提示
  if (isHandledByInterceptor(res)) return
  ElMessage({ message: errMsg(res, '账号信息获取失败，请刷新页面重试'), type: 'error' })
}
onMounted(refreshUserInfo)

/* ---------- 修改密码 ---------- */
const pwDialogVisible = ref(false)
const pwSubmitting = ref(false)
const pwForm = reactive({ oldPassword: '', password: '', confirmPassword: '' })

// 密码强度：只对「新密码」实时算。库里存的是 BCrypt 哈希，反推不出原密码的强度，
// 所以「当前密码强度」这个信息本身就不存在，只能在新密码上给提示。
const pwStrength = computed(() => {
  const pw = pwForm.password || ''
  if (!pw) return { text: '', color: '' }
  let kinds = 0
  if (/[a-z]/.test(pw)) kinds++
  if (/[A-Z]/.test(pw)) kinds++
  if (/\d/.test(pw)) kinds++
  if (/[^a-zA-Z0-9]/.test(pw)) kinds++
  if (pw.length < 6 || kinds <= 1) return { text: '弱', color: '#e74c3c' }
  if (pw.length >= 8 && kinds >= 3) return { text: '强', color: '#27ae60' }
  return { text: '中', color: '#f39c12' }
})

const openPwDialog = () => {
  pwForm.oldPassword = ''
  pwForm.password = ''
  pwForm.confirmPassword = ''
  pwDialogVisible.value = true
}

const submitPassword = async () => {
  if (pwSubmitting.value) return
  if (!pwForm.oldPassword) return ElMessage({ message: '请输入当前密码', type: 'warning' })
  if (!pwForm.password) return ElMessage({ message: '请输入新密码', type: 'warning' })
  if (pwForm.password.length < 6) return ElMessage({ message: '新密码至少 6 位', type: 'warning' })
  if (pwForm.password !== pwForm.confirmPassword) return ElMessage({ message: '两次输入的新密码不一致', type: 'warning' })
  if (pwForm.password === pwForm.oldPassword) return ElMessage({ message: '新密码不能与当前密码相同', type: 'warning' })
  pwSubmitting.value = true
  try {
    const res = await updatePassword({
      oldPassword: pwForm.oldPassword,
      newPassword: pwForm.password
    })
    if (isHandledByInterceptor(res)) return
    if (res.code == 200) {
      pwDialogVisible.value = false
      ElMessage({ message: '密码修改成功，下次请用新密码登录', type: 'success' })
    } else {
      // 后端把「原密码不对」放在 msg 里（用户登录信息错误），必须原样透出，
      // 否则用户不知道是自己输错了还是系统坏了
      ElMessage({ message: errMsg(res, '密码修改失败'), type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: '密码修改失败，请稍后重试', type: 'error' })
  } finally {
    pwSubmitting.value = false
  }
}

/* ---------- 更换手机号 ---------- */
const phoneDialogVisible = ref(false)
const phoneSubmitting = ref(false)
const phoneForm = reactive({ cellPhone: '', code: '' })
const codeCountdown = ref(0)
// 演示环境后端会把验证码回显在 data 里（短信通道 AK 已清空，真机收不到）
const echoedCode = ref('')
let codeTimer = null

const openPhoneDialog = () => {
  phoneForm.cellPhone = ''
  phoneForm.code = ''
  echoedCode.value = ''
  phoneDialogVisible.value = true
}

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

const onPhoneDialogClosed = () => {
  clearInterval(codeTimer)
  codeTimer = null
  codeCountdown.value = 0
}

const sendCodeHandle = async () => {
  if (codeCountdown.value > 0) return
  const cellPhone = (phoneForm.cellPhone || '').trim()
  if (!PHONE_RE.test(cellPhone)) return ElMessage({ message: '请输入正确的手机号', type: 'warning' })
  if (cellPhone === (store.getUserInfo?.cellPhone || '').trim()) {
    return ElMessage({ message: '新手机号与当前手机号相同', type: 'warning' })
  }
  try {
    const res = await sendCode({ cellPhone })
    if (isHandledByInterceptor(res)) return
    if (res.code == 200) {
      // 演示环境 data 里带验证码，直接显示出来，否则这条流程演示不了
      if (res.data) {
        echoedCode.value = res.data
        ElMessage({ message: `演示环境验证码：${res.data}`, type: 'info', duration: 8000 })
      } else {
        ElMessage({ message: '验证码已发送，请查看短信', type: 'success' })
      }
      startCountdown()
    } else {
      // 60 秒冷却期内重复点会走到这里（后端 SETNX 拒绝）
      ElMessage({ message: errMsg(res, '验证码发送失败'), type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: '验证码发送失败，请稍后重试', type: 'error' })
  }
}

const submitPhone = async () => {
  if (phoneSubmitting.value) return
  const cellPhone = (phoneForm.cellPhone || '').trim()
  if (!PHONE_RE.test(cellPhone)) return ElMessage({ message: '请输入正确的手机号', type: 'warning' })
  if (cellPhone === (store.getUserInfo?.cellPhone || '').trim()) {
    return ElMessage({ message: '新手机号与当前手机号相同', type: 'warning' })
  }
  if (!phoneForm.code) return ElMessage({ message: '请输入验证码', type: 'warning' })
  phoneSubmitting.value = true
  try {
    const res = await updatePhone({ cellPhone, code: phoneForm.code })
    if (isHandledByInterceptor(res)) return
    if (res.code == 200) {
      phoneDialogVisible.value = false
      await refreshUserInfo()
      // username 与手机号是同一个值，换了号登录名也就变了，这里必须提醒一句
      ElMessage({ message: '手机号修改成功，下次登录请使用新手机号', type: 'success', duration: 5000 })
    } else {
      ElMessage({ message: errMsg(res, '手机号修改失败'), type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: '手机号修改失败，请稍后重试', type: 'error' })
  } finally {
    phoneSubmitting.value = false
  }
}

/* ---------- 绑定 / 解绑邮箱 ---------- */
const emailDialogVisible = ref(false)
const emailSubmitting = ref(false)
const emailForm = reactive({ email: '' })

const openEmailDialog = () => {
  // 预填当前邮箱，用户想解绑就清空后点确定
  emailForm.email = (store.getUserInfo?.email || '').trim()
  emailDialogVisible.value = true
}

const submitEmail = async () => {
  if (emailSubmitting.value) return
  const email = (emailForm.email || '').trim()
  if (email && !EMAIL_RE.test(email)) return ElMessage({ message: '邮箱格式不正确', type: 'warning' })
  if (email === (store.getUserInfo?.email || '').trim()) {
    return ElMessage({ message: '邮箱未发生变化', type: 'warning' })
  }
  emailSubmitting.value = true
  try {
    // 传空字符串 = 解绑（后端用 UpdateWrapper 显式 set null，能真正清掉）
    const res = await updateEmail({ email })
    if (isHandledByInterceptor(res)) return
    if (res.code == 200) {
      emailDialogVisible.value = false
      await refreshUserInfo()
      ElMessage({ message: email ? '邮箱绑定成功' : '邮箱已解绑', type: 'success' })
    } else {
      ElMessage({ message: errMsg(res, '邮箱保存失败'), type: 'error' })
    }
  } catch (e) {
    ElMessage({ message: '邮箱保存失败，请稍后重试', type: 'error' })
  } finally {
    emailSubmitting.value = false
  }
}

// 组件销毁时清掉倒计时，避免定时器泄漏（切走页面后还在改一个已卸载组件的 ref）
onBeforeUnmount(() => {
  clearInterval(codeTimer)
  codeTimer = null
})
</script>
<style lang="scss" src="./index.scss"> </style>
<style lang="scss">
/* el-dialog 会 teleport 到 body，所以这些样式不能写在 .mySetWrapper 里（选择器匹配不到） */
.mySet-field {
  width: 100%;
}
.mySet-pw-strength {
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}
.mySet-code-row {
  display: flex;
  align-items: center;
  .el-input { flex: 1; }
  .mySet-code-btn {
    flex: none;
    width: 110px;
    height: 32px;
    line-height: 32px;
    margin-left: 12px;
  }
}
.mySet-tip {
  font-size: 12px;
  line-height: 20px;
  color: var(--color-font2);
  b { color: var(--color-main); }
}
</style>
