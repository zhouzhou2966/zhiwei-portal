import request from "@/utils/request.js"

const LEARNING_API_PREFIX = "/ls"
const EXAM_API_PREFIX = "/es"

/**
 * 学习活跃度按天聚合（后端 2026-11-17 新增）。
 * 缺失日期后端已补 0；30/90 天两档给报告页，7 天给概览页的本周节奏。
 */
export const getLearningSummary = (days) =>
request({
	url: `${LEARNING_API_PREFIX}/learning-records/summary`,
	method: 'get',
	params: { days }
})

// 原先还有 getLearningTodo（/ls/lessons/todo）：概览页的「到期提醒」模块已下线，
// 到期信息改到「我的课程」里用课程列表自带的 expireTime 算，不再单独请求。
// 后端接口保留着（返回 planGap + expiring），前端目前没有调用方。
