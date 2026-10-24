/**
 * 图片资源品牌映射
 *
 * 背景：后端把用户头像、课程封面等图片托管在对象存储上，接口返回的是
 * `/img-tx/xxx.jpg` 形式的相对地址（由网关/nginx 反代到对象存储）。
 * 其中默认头像带着外部培训机构的品牌信息，直接展示与本站定位不符。
 *
 * 处理方式：在响应层做一次统一映射，把这些地址换成本地 `public` 下的自有资源。
 * 好处是只改前端一处，开发、构建、部署三种环境同时生效，不需要改动后端服务、
 * 数据库记录或 nginx 配置。
 */

// 需要拦截的图片文件名 -> 本地资源地址
// 只处理「默认用户头像」：它是全站唯一的兜底头像，替换后各处表现一致。
// 课程封面属于逐条数据，只换其中几张会造成列表内风格不统一，故不做替换。
const BRAND_IMAGE_MAP = [
  ['default-user-icon.jpg', '/avatar-default.svg'],
  ['1.jpg', '/avatar-default.svg'],
];

/**
 * 单个地址的映射。只处理 /img-tx/ 前缀的地址，其它图片（例如用户自己上传的
 * 头像、真实课程封面）原样返回，不受影响。
 * @param {string} url 图片地址
 * @returns {string} 映射后的地址
 */
function mapOneUrl(url) {
  if (typeof url !== 'string' || url.indexOf('/img-tx/') === -1) return url;
  // 去掉查询串/哈希后再比较文件名，避免 ?x-oss-process=... 之类的参数干扰
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  for (let i = 0; i < BRAND_IMAGE_MAP.length; i++) {
    const [name, local] = BRAND_IMAGE_MAP[i];
    // 本地资源不需要沿用原地址的查询参数
    if (path.endsWith('/' + name)) return local;
  }
  return url;
}

const MAX_DEPTH = 8;

/**
 * 递归遍历接口返回的数据，替换其中的图片地址。就地修改并返回原对象。
 * @param {*} data 接口响应体
 * @param {number} depth 当前递归深度（内部使用）
 * @returns {*} 处理后的数据
 */
export function mapBrandImages(data, depth = 0) {
  if (!data || typeof data !== 'object' || depth > MAX_DEPTH) return data;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item === 'string') {
        data[i] = mapOneUrl(item);
      } else if (item && typeof item === 'object') {
        mapBrandImages(item, depth + 1);
      }
    }
    return data;
  }
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    if (typeof value === 'string') {
      data[key] = mapOneUrl(value);
    } else if (value && typeof value === 'object') {
      mapBrandImages(value, depth + 1);
    }
  }
  return data;
}

export default mapBrandImages;
