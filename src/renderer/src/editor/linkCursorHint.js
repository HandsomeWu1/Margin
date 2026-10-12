import { Plugin, PluginKey } from '@milkdown/prose/state';
import { $prose } from '@milkdown/utils';

// 与 global.css 中 .link-hotkey-active 规则对应的类名。
const ACTIVE_CLASS = 'link-hotkey-active';

/**
 * 按住 Cmd（macOS）/ Ctrl 时给编辑器根节点加类名，让链接光标从工字形变成手型，
 * 提示「此时单击会用系统浏览器打开」（跳转逻辑见 linkClick.js）。
 *
 * 必须监听 keyup 之外的 blur / visibilitychange：Cmd+单击唤起浏览器或 Cmd+Tab 切走后，
 * 窗口已失焦，macOS 不会把 Meta 的 keyup 投递回来，只靠 keyup 会把手型光标卡死。
 */
export const linkCursorHint = $prose(
  () =>
    new Plugin({
      key: new PluginKey('link-cursor-hint'),
      view: (view) => {
        const root = view.dom;
        const setActive = (on) => root.classList.toggle(ACTIVE_CLASS, on);

        const isHotkey = (event) => event.metaKey || event.ctrlKey;

        const onKeyDown = (event) => {
          if (isHotkey(event)) setActive(true);
        };
        // 松开修饰键本身时该键的 metaKey/ctrlKey 为 false，据此复位；
        // 若松的是别的键而 Cmd 仍按住（event.metaKey 为 true），则保持手型。
        const onKeyUp = (event) => {
          if (!isHotkey(event)) setActive(false);
        };
        const onBlur = () => setActive(false);
        const onVisibilityChange = () => {
          if (document.hidden) setActive(false);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return {
          destroy() {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            setActive(false);
          },
        };
      },
    })
);
