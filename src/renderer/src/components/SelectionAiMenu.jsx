import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, useState, useEffect } from 'react';

// 选区浮动 AI 菜单的快捷动作。结果只作为「对话回复」展示在 AI 面板里，不直接改写文档——
// 因此指令要求模型以回复形式给出内容（不要用 %%REWRITE%% 改写标记）。
// 用户要落盘时自行在对话框说「改到文件里」，由模型输出改写标记再写入。
export const AI_SELECTION_PRESETS = [
  {
    key: 'polish',
    label: '润色',
    instruction: '请在回复中润色下面的选中内容，使其更通顺、准确、得体，保留原意，直接输出润色后的文本（不要使用代码块包裹，不要输出改写标记）：',
  },
  {
    key: 'expand',
    label: '扩写',
    instruction: '请在回复中基于下面的选中内容扩写，补充合理的细节与展开，直接输出扩写后的文本（不要使用代码块包裹，不要输出改写标记）：',
  },
  {
    key: 'condense',
    label: '精简',
    instruction: '请在回复中把下面的选中内容改得更简洁，去掉冗余，保留关键信息，直接输出精简后的文本（不要使用代码块包裹，不要输出改写标记）：',
  },
  {
    key: 'translate',
    label: '翻译',
    instruction: '请在回复中把下面的选中内容翻译（若原文是中文则译为英文，否则译为中文），直接给出译文（不要使用代码块包裹，不要输出改写标记）：',
  },
  {
    key: 'summarize',
    label: '总结',
    instruction: '请在回复中用一两句话总结下面的选中内容，直接给出总结（不要输出改写标记）：',
  },
  {
    key: 'mermaid',
    label: '生成图表',
    instruction: '请在回复中把下面的内容转化为一个 Mermaid 图（优先用流程图，必要时用结构图/时序图），用 ```mermaid 代码块输出（不要输出改写标记）：',
  },
];

// 基本编辑操作：与平台习惯一致，右键菜单第一行放 复制/剪切/粘贴/全选。
const BASIC_ACTIONS = [
  { key: 'copy', label: '复制', needsSelection: true },
  { key: 'cut', label: '剪切', needsSelection: true },
  { key: 'paste', label: '粘贴', needsSelection: false },
  { key: 'selectAll', label: '全选', needsSelection: false },
];

export default function SelectionAiMenu({ rect, hasSelection, aiEnabled, onBasic, onAction, onClose }) {
  const menuRef = useRef(null);
  // rect 现在表示「触发点」（右键的 clientX/clientY）。钳制到视口内并向右下偏移一点，
  // 避免菜单正好压在指针下造成误触。useLayoutEffect 在绘制前同步计算，避免先闪到越界位置。
  const [pos, setPos] = useState(rect);
  useLayoutEffect(() => {
    if (!rect) {
      setPos(null);
      return;
    }
    const el = menuRef.current;
    if (!el) {
      setPos(rect);
      return;
    }
    const m = el.getBoundingClientRect();
    const margin = 8;
    const offset = 10; // 与指针保持的距离
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = rect.left + offset;
    let top = rect.top + offset;
    // 右/下溢出时反向弹出；再不够就贴边，保证完整可见
    if (left + m.width > vw - margin) left = Math.max(margin, rect.left - m.width - offset);
    if (top + m.height > vh - margin) top = Math.max(margin, rect.top - m.height - offset);
    if (left < margin) left = margin;
    if (top < margin) top = margin;
    setPos({ left, top });
  }, [rect]);

  // 点击菜单外部（正文、侧栏、标题栏等）时关闭，避免右键弹出后一直挂着。
  useEffect(() => {
    if (!rect) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [rect, onClose]);

  if (!rect) return null;
  const menu = (
    <div
      ref={menuRef}
      className="ai-sel-menu"
      style={{ position: 'fixed', left: (pos || rect).left, top: (pos || rect).top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="ai-sel-basic">
        {BASIC_ACTIONS.map((b) => (
          <button
            key={b.key}
            type="button"
            disabled={b.needsSelection && !hasSelection}
            onClick={() => onBasic(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
      {hasSelection && aiEnabled && (
        <>
          <div className="ai-sel-sep" />
          {AI_SELECTION_PRESETS.map((p) => (
            <button key={p.key} type="button" onClick={() => onAction(p)}>
              {p.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
  return createPortal(menu, document.body);
}
