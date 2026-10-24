/**
 * 视频播放器配置
 *
 * 平台课程视频托管在腾讯云点播（VOD）上，前端通过 TCPlayer 按 fileID + 播放签名播放。
 * appID 必须与视频所属的云点播账号一致，否则播放器会返回「视频不存在」。
 *
 * 注意：更换 appID 属于账号级迁移 —— 需要把全部课程视频重新上传到新账号并同步
 * 更新后端返回的 fileID，只改这里的值会导致所有视频无法播放。
 */
export const PLAYER_APP_ID = '1312394356';

export default {
  appId: PLAYER_APP_ID,
};
