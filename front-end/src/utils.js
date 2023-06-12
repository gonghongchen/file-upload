export const getAssets = (path) => {
  return new URL(`./assets/${path}`, import.meta.url).href
}

export const isPC = () => {
  const userAgentInfo = window.navigator.userAgent
  const Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPod"]
  let flag = true
  for (let i = 0; i < Agents.length; i++) {
    if (userAgentInfo.indexOf(Agents[i]) > 0) {
      flag = false
      break
    }
  }
  return flag
}