"use strict"


const path = require("path")

// 兼容windows与类linux系统路径
function formatPath(pathString) {
  if (pathString && typeof pathString === "string") {
    const sep = path.sep
    if (sep === "/") {
      return pathString
    } else {
      return pathString.replace(/\\/g, "/")
    }
  }
  return pathString
}

module.exports = formatPath
