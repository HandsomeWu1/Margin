import { Plugin, PluginKey } from '@milkdown/prose/state';
import { $prose } from '@milkdown/utils';

/**
 * 链接点击跳转：Cmd（macOS）/ Ctrl 单击链接时用系统浏览器打开。
 *
 * 为什么必须自己接管：
 * 1. 编辑器正文是 contenteditable，Chromium 默认不会跟随 <a href> 跳转（只移动光标）；
 * 2. 主进程 will-navigate 会拦掉应用内导航，即便触发了跳转也走不到浏览器。
 *
 * 为什么只认修饰键单击：普通单击要保持「放置光标 / 编辑链接文字」的默认行为，
 * 否则点进链接改个字就弹浏览器，误触成本太高（同 Obsidian / VSCode / Notion）。
 *
 * 注意：不用 props.handleClick —— ProseMirror 会把 <500ms 内的第二次点击识别为
 * doubleClick 而走 handleDoubleClick，快速连点会漏掉（同 taskListToggle 的注释）。
 */
export const linkClick = $prose(
  () =>
    new Plugin({
      key: new PluginKey('link-click'),
      props: {
        handleDOMEvents: {
          click: (_view, event) => {
            if (event.button !== 0) return false;
            if (!(event.metaKey || event.ctrlKey)) return false;

            const target = event.target;
            if (!(target instanceof Element)) return false;
            const anchor = target.closest('a[href]');
            if (!anchor) return false;

            const href = anchor.getAttribute('href');
            if (!href) return false;

            event.preventDefault();
            window.api?.openExternal?.(href);
            return true;
          },
        },
      },
    })
);
