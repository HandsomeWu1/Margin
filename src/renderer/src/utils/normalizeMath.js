/**
 * 把各种「开合不一致」的公式定界符归一化为 remark-math 能识别的 $...$ / $$...$$。
 *
 * 背景：编辑器底层是 remark-math，只认 `$`/`$$` 成对的定界符。但实际文档里常出现
 * 混用 / 丢反斜杠的写法，例如用 `\[...\]`、`$$...]`、`$$...\]`（见 10-成本怎么算.md）。
 * 这些若不做处理，开头被识别成 `$$` 却找不到闭合，会把后文整段吞进一个未闭合公式块，
 * 表现为整页红色报错。
 *
 * 采用「逐行配对」：
 * - 开：独占一行的 `$$` 或 `\[`；
 * - 闭：独占一行的 `$$`、`\]` 或 `]`；
 * - 开是 `\[` 时改成 `$$`，闭是 `\]`/`]` 时改成 `$$`；
 * - 只有配对成功才改写，找不到闭合就整段原样保留，绝不制造未闭合的 `$$`。
 * - 行内公式：同一行内 `\(...\)` -> `$...$`。
 * - 围栏代码块（``` / ~~~）内一律不改。
 */
export function normalizeMathDelimiters(md) {
  if (typeof md !== 'string' || md.length === 0) return md;

  const lines = md.split('\n');
  const n = lines.length;

  // 1) 标记围栏代码块行（含开/闭围栏行本身），围栏内一律原样保留
  const inFence = new Array(n).fill(false);
  let fence = null; // '`' 或 '~'
  for (let i = 0; i < n; i++) {
    const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence === null) {
      if (m) {
        fence = m[1][0];
        inFence[i] = true;
      }
    } else {
      inFence[i] = true;
      const closeRe = fence === '`' ? /^\s{0,3}`{3,}\s*$/ : /^\s{0,3}~{3,}\s*$/;
      if (closeRe.test(lines[i])) fence = null;
    }
  }

  // 1.5) 独立的 3 个及以上 $ 的行，几乎必然是 $$ 的笔误（如 $$$），折叠成 $$（1:1，不改行数）
  for (let i = 0; i < n; i++) {
    if (!inFence[i] && /^\s*(\${3,})\s*$/.test(lines[i])) {
      lines[i] = '$$';
    }
  }

  // 2) 配对公式块
  const OPEN_RE = /^\s*(\$\$|\\\[)\s*$/;
  const CLOSE_RE = /^\s*(\$\$|\\\]|])\s*$/;
  const toOpen = new Set(); // \[ -> $$
  const toClose = new Set(); // ] 或 \] -> $$
  const inMath = new Set(); // 块内容行：跳过行内替换，保持 verbatim

  for (let i = 0; i < n; i++) {
    if (inFence[i]) continue;
    const om = lines[i].match(OPEN_RE);
    if (!om) continue;
    let j = i + 1;
    while (j < n && !CLOSE_RE.test(lines[j])) j++;
    if (j >= n) continue; // 未闭合：保持原样，避免制造未闭合的 $$
    if (om[1] === '\\[') toOpen.add(i);
    if (!/^\s*\$\$\s*$/.test(lines[j])) toClose.add(j); // 闭不是 $$ 才需要改
    for (let k = i + 1; k < j; k++) inMath.add(k);
    i = j;
  }

  // 3) 重建
  const out = lines.map((line, idx) => {
    if (inFence[idx]) return line;
    if (toOpen.has(idx)) return line.replace(/\\\[/, () => '$$');
    if (toClose.has(idx)) return line.replace(/^\s*(?:\\\]|])/, () => '$$');
    if (inMath.has(idx)) return line;
    return line
      .replace(/(?<!\\)\\\(/g, () => '$')
      .replace(/(?<!\\)\\\)/g, () => '$');
  });

  return out.join('\n');
}
