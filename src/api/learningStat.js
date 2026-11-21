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

/**
 * 学习概览页的待办 + 即将到期（后端 2026-11-17 新增）。
 * 任何异常后端都返回空结构，前端按空态展示。
 */
export const getLearningTodo = () =>
request({
	url: `${LEARNING_API_PREFIX}/lessons/todo`,
	method: 'get'
})
