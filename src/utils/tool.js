 // 转换 A、B、C、D
export const upperAlpha = (num, type) => {
  let str = ''
  let n = type && type == 0 ? num : num - 1
  switch(n){
    case 0 :
      str = 'A';
      break
    case 1 :
      str = 'B';
      break
    case 2 :
      str = 'C';
      break
    case 3 :
      str = 'D';
      break
    case 4 :
      str = 'E';
      break
  }
  return str
}
// 时间转换 h:m:s
export const timeFormat = (time) => {
    //  秒
    let second = parseInt(time)
    //  分
    let minute = '00'
    //  小时
    let hour = '00'

    if (second > 60) {
        //  获取分钟，除以60取整数，得到整数分钟
        minute = parseInt(second / 60)
        //  获取秒数，秒数取佘，得到整数秒数
        second = parseInt(second % 60)
        //  如果分钟大于60，将分钟转换成小时
        if (minute > 60) {
          //  获取小时，获取分钟除以60，得到整数小时
          hour = parseInt(minute / 60)
          //  获取小时后取佘的分，获取分钟除以60取佘的分
          minute = parseInt(minute % 60)
        }
      }
    return `${hour} : ${minute} : ${second}`
}

export const amountConversion = (item) => {
  let amount = '0'
  if (item){
    amount = (item / 100).toFixed(2)
  } 
  return amount
}

/**
 * 把「秒」格式化成课程目录里的时长标签。
 *
 * 为什么不用上面的 timeFormat：它返回 "00 : 4 : 24"（带空格、不补零），
 * 而且判断写的是 `if (second > 60)` —— 正好 60 秒会漏判，返回 "00:00:60"。
 * 目录里要的是紧凑的 "4:24"，两个需求不一样，另起一个更清楚。
 *
 * 规则：
 *   不满 1 小时 → "分:秒"，如 264 → "4:24"
 *   满 1 小时   → "时:分:秒"，如 3723 → "1:02:03"
 * 秒和分都补零到两位；分钟在无小时时不补零（"4:24" 而不是 "04:24"）。
 *
 * 入参做了容错：null / undefined / 空串 / 非数字都当 0 处理，避免目录里出现 "NaN:NaN"。
 */
export const durationFormat = (sec) => {
  const total = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}