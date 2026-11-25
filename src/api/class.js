import request from "@/utils/request.js"
const SEARCH_API_PREFIX = "/ss"
const COURSE_API_PREFIX = "/cs"
const LEARNING_API_PREFIX = "/ls"
const MEDIA_API_PREFIX = "/ms"
const PROMOTION_API_PREFIX = "/prs"
const EXAM_API_PREFIX = "/es"
// 课程分类
export const getClassCategorys = (params) =>
	request({
		url: `${COURSE_API_PREFIX}/categorys/all`,
		method: 'get',
		params
	})

// 获取课程推荐接口
export const getRecommendClassList = (type) =>
	request({
		url: `${SEARCH_API_PREFIX}/recommend/${type}`,
		method: 'get'
	})

// 获取课程列表 - 分类id 查询对应的列表 （倒序 十条）
export const getClassList = (id) =>
	request({
		url: `${SEARCH_API_PREFIX}/interests/${id}/courses`,
		method: 'get'
	})

// 获取学习计划 getLearningPlan	
export const getLearningPlan = (id) =>
	request({
		url: `${LEARNING_API_PREFIX}/plans`,
		method: 'get'
	})

// 查询当前用户学习的指定课程信息，返回null则代表没有购买	
export const getCourseLearning = (courseId) =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/${courseId}`,
	method: 'get'
})	
// 课程搜索
export const classSeach = (params) =>
	request({
		url: `${SEARCH_API_PREFIX}/courses/portal`,
		method: 'get',
		params
	})


// 学习相关接口
export const getLearningClassDetails = (id) =>
	request({
		url: `${COURSE_API_PREFIX}/courses/${id}/catalogs`,
		method: 'get'
	})



// 兴趣接口

// 新增兴趣爱好
export const setInterests = (params) =>
	request({
		url: `${SEARCH_API_PREFIX}/interests`,
		method: 'post',
		data:params,
		params
	})	
// 查询我的兴趣爱好
export const getInterests = (params) =>
	request({
		url: `${SEARCH_API_PREFIX}/interests`,
		method: 'get',
		params
	})		

// 获取播放视频的授权签名
export const getMediasSignature = (params) =>
	request({
		url: `${MEDIA_API_PREFIX}/medias/signature/play`,
		method: 'get',
		params
	})	
// 优惠券 相关接口
// 格式化规则
export const formatRule = (d) => {
	let rule = "";
	let PER_PRICE_DISCOUNT = 1, RATE_DISCOUNT = 2,NO_THRESHOLD = 3, PRICE_DISCOUNT = 4
	// 门槛与上限为 0 时业务含义是「无门槛」「不封顶」，直接拼进文案会变成
	// 「满0元打8折」「每满100元减15元，不超过0元」这种自相矛盾的说明
	// （上限 0 元等于告诉用户这张券不能用）。所以先把 0 归一成「没有这个限制」再拼。
	const threshold = Number(d.thresholdAmount) || 0;
	const value = Number(d.discountValue) || 0;
	const max = Number(d.maxDiscountAmount) || 0;
	const cap = max > 0 ? `，不超过${max / 100}元` : "";
	switch (d.discountType) {
		case PER_PRICE_DISCOUNT:
			// 每满减的「每满」必须是正数才有意义，脏数据下退化成一次性的直减
			rule = threshold > 0
				? `每满${threshold / 100}元减${value / 100}元${cap}`
				: `直减${value / 100}元${cap}`;
			break;
		case PRICE_DISCOUNT:
			rule = threshold > 0
				? `满${threshold / 100}元减${value / 100}元`
				: `无门槛减${value / 100}元`;
			break;
		case NO_THRESHOLD:
			rule = `无门槛抵扣${value / 100}元`;
			break;
		case RATE_DISCOUNT:
			// 不能写「全场打8折」：限定分类的券（specific=1）门槛往往就是 0，
			// 此时「全场」和券面上「仅限 X 个分类」直接打架，用户会以为券用不了。
			// 范围交给 scope 那行说，这里只描述折扣本身。
			rule = `${threshold > 0 ? `满${threshold / 100}元` : ""}打${value / 10}折${cap}`;
			break;
	}
	return rule;
}
// 可领优惠券（超值优惠券）
export const getCollectableCoupon = (params) =>
request({
	url: `${PROMOTION_API_PREFIX}/coupons/list`,
	method: 'get',
	params
})		
// 我的优惠券（近一年）
export const getMyCoupon = (params) =>
request({
	url: `${PROMOTION_API_PREFIX}/user-coupons/page`,
	method: 'get',
	params
})	
// 优惠券领取
export const getCoupon = (params) =>
request({
	url: `${PROMOTION_API_PREFIX}/user-coupons/${params.id}/receive`,
	method: 'post'
})	
// 兑换码兑换优惠券
export const exchangeCoupon = (data) =>
request({
	url: `${PROMOTION_API_PREFIX}/user-coupons/${data.code}/exchange`,
	method: 'post'
})	
// 兑换码预检：输入框里查一次，提前告诉用户会换到什么券、能不能兑
// 只读接口，不占名额也不动库存，所以可以在输入时防抖调用
export const previewExchangeCoupon = (code) =>
request({
	url: `${PROMOTION_API_PREFIX}/user-coupons/${code}/preview`,
	method: 'get'
})

// 课程表管理接口

// 查询我的课程表
// ⚠️ 必须接收 params：后端接收的是 PageQuery（pageNo / pageSize，默认 1 / 20）。
// 原来这个函数没有形参，调用处传的 {page:1, pageSize:10} 被静默丢弃，
// 于是永远只能拿到第 1 页的 20 条，翻页参数形同虚设。
// 注意参数名是 pageNo 不是 page。
export const getMylessons = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/page`,
	method: 'get',
	params
})	
// 查询我正在学习的课程
export const getMyLearning = () =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/now`,
	method: 'get',
})

// 查询我的学习计划
// 同上，后端是 PageQuery，不传就是第 1 页 20 条
export const getMyPlan = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/plans`,
	method: 'get',
	params
})
/*
// 重新学习课程
export const restartMyLesson = (courseId) =>
	request({
		url: `${LEARNING_API_PREFIX}/lessons/${courseId}/restart`,
		method: 'PUT',
	})*/

// 报名免费课程
export const signUp = (courseId) =>
request({
	url: `/ts/orders/freeCourse/${courseId}`,
	method: 'psot',
})

// 将指定课程从课程表移除
export const delMyClass = (courseId) =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/${courseId}`,
	method: 'delete',
})

// 创建学习计划
export const creatPlans = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/plans`,
	method: 'post',
	data: params
})

// 考试相关
// 分页查询我的考试记录
export const getExamList = (params) =>
request({
	url: `${EXAM_API_PREFIX}/exams/page`,
	method: 'get',
	params
})
// 我的考试 · 全量统计（次数 / 均分 / 最高分）。
// 列表改后端分页后，统计头不能拿当前页凑数 —— 那会随翻页变化
export const getExamStats = () =>
request({
	url: `${EXAM_API_PREFIX}/exams/stats`,
	method: 'get'
})
// 查询我的考试记录详情
export const getExamDetails = (id) =>
request({
	url: `${EXAM_API_PREFIX}/exams/${id}`,
	method: 'get',
})
// 查询当前用户已完成考试的小节id列表（课程目录里给练习/考试节点打勾用）
export const getFinishedSections = () =>
request({
	url: `${EXAM_API_PREFIX}/exams/finished-sections`,
	method: 'get',
})
// 提交考试答案，考试或测试提交时需要保存答案信息
export const submitExamRecords = (params) =>
request({
	url: `${EXAM_API_PREFIX}/exam-records/details`,
	method: 'post',
	data:params
})
// 新增考试记录，考试或测试开始时需要保存基本信息，返回记录id
export const addExamRecords = (params) =>
request({
	url: `${EXAM_API_PREFIX}/exam-records`,
	method: 'post',
	data:params
})

// 课程表的信息

// 查询我的某个课程表的学习记录
export const getLearningLog = (lessonId) =>
request({
	url: `${LEARNING_API_PREFIX}/learning-records/lessons/${lessonId}`,
	method: 'get'
})

// 新增学习记录，在学习某小节时提交
export const addPlayLog = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/learning-records`,
	method: 'post',
	data:params
})



/**  积分相关的接口 **/

// 签到打卡功能，返回本次签到的积分值
export const pointsSign = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/sign-records`,
	method: 'post',
	data:params
})
// 获取签到记录
export const getSignRecords = () =>
request({
	url: `${LEARNING_API_PREFIX}/sign-records`,
	method: 'get',
})
// 获取签到记录
export const getTodayPoints = () =>
request({
	url: `${LEARNING_API_PREFIX}/points/today`,
	method: 'get',
})
// 查询指定赛季信息
export const getSeasons = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/boards`,
	method: 'get',
	params
})
// 查询赛季信息列表
export const getSelectOptions = (params) =>
request({
	url: `${LEARNING_API_PREFIX}/boards/seasons/list`,
	method: 'get',
	params
})

