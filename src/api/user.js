import request from "@/utils/request.js"
const USER_API_PREFIX = "/us"
const AUTH_API_PREFIX = "/as"
const PHONE_LOGIN_TYPE = 2;
const PW_LOGIN_TYPE = 1;
// 手机号验证码登录
export const phoneLogins = (params) => {
	params.type = PHONE_LOGIN_TYPE;
	return request({
		url: `${AUTH_API_PREFIX}/accounts/login`,
		method: "post",
		params,
		withCredentials: true
	});
}
// 账号登录
export const userLogins = (data) => {
	data.type = PW_LOGIN_TYPE;
	return request({
		url: `${AUTH_API_PREFIX}/accounts/login`,
		method: "post",
		data,
		withCredentials: true
	});
}
// 发送注册验证码（注册页是匿名的：用户还没账号，不可能带 token）
// ⚠️ 后端 CodeController 用 @RequestBody 接收，必须用 data 而不是 params，
//    否则即使路径对了也会报 400「Required request body is missing」。
export const verifycode = (data) =>
request({
	url: `${USER_API_PREFIX}/code`,
	method: 'post',
	data
})
// 账号注册
// 原教程指向 auth 服务的 /as/users/register —— 那个接口根本不存在（auth 只预留了路径没实现），
// 真正的注册入口是 zw-user 的 POST /students/register。
export const userRegist = (data) =>
request({
	url: `${USER_API_PREFIX}/students/register`,
	method: 'post',
	data
})
// 获取用户信息
export const getUserInfo = (params) =>
	request({
		url: `${USER_API_PREFIX}/users/me`,
		method: 'get',
		params
	})	
// 更改用户信息
// ⚠️ 必须带 /us 前缀：网关配了 default-filters: StripPrefix=1，
//    `/students` 去掉首段后变成空路径 → 匹配不到任何路由 → 404
//    （而且这个 404 被包成了 HTTP 200，光看状态码发现不了）。
export const updateUserInfo = (params) =>
	request({
		url: `${USER_API_PREFIX}/students`,
		method: 'put',
		data:params
	})
// 修改当前登录用户的登录密码（原密码 + 新密码）
// 走专用接口 PUT /us/students/login-password，请求体只有 { oldPassword, newPassword }。
// （原来复用教程的 PUT /us/users：那个接口的 UserFormDTO 继承自 UserDTO，
//   而 UserDTO.type 带 @NotNull，导致前端被迫塞一个毫无意义的 type: 2。）
export const updatePassword = (data) =>
	request({
		url: `${USER_API_PREFIX}/students/login-password`,
		method: 'put',
		data
	})
// 发送短信验证码（换绑手机用）
// ⚠️ 注意与上面的 verifycode 不是一回事：那个走 /as（auth 服务，教程预留但没实现），
//    这个走 /us（zw-user 的 CodeController，本次新加）。
export const sendCode = (data) =>
	request({
		url: `${USER_API_PREFIX}/code`,
		method: 'post',
		data
	})
// 修改当前登录用户的手机号（需要新手机号收到的验证码）
export const updatePhone = (data) =>
	request({
		url: `${USER_API_PREFIX}/students/phone`,
		method: 'put',
		data
	})
// 修改/解绑当前登录用户的邮箱（email 传空字符串表示解绑）
export const updateEmail = (data) =>
	request({
		url: `${USER_API_PREFIX}/students/email`,
		method: 'put',
		data
	})
// 查询手机号是否可用（返回 true 表示还没被占用）
export const checkCellphone = (params) =>
	request({
		url: `${USER_API_PREFIX}/users/checkCellphone`,
		method: 'get',
		params
	})
// 账号退出登录
export const userLogout = () => {
	return request({
		url: `${AUTH_API_PREFIX}/accounts/logout`,
		method: "post",
		withCredentials: true
	});
}