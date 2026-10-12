'use strict';
const { shell } = require('electron');

// 仅允许 http/https 走系统浏览器。
// 其余协议一律拒绝：javascript:/data: 可用于脚本注入，file:/smb: 等会泄露本地或内网文件。
// 用 URL 解析而非正则前缀匹配，避免 `javascript:\nhttps://` 这类绕过。
function normalizeExternalUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.href;
}

/**
 * 用系统默认浏览器打开外链。
 * @param {string} raw 原始 URL（来自渲染层或导航事件，视为不可信输入）
 * @returns {boolean} 是否确实发起了打开请求
 */
function openExternal(raw) {
  const url = normalizeExternalUrl(raw);
  if (!url) return false;
  // openExternal 返回 Promise，失败不应影响调用方
  Promise.resolve(shell.openExternal(url)).catch(() => {});
  return true;
}

module.exports = { normalizeExternalUrl, openExternal };
