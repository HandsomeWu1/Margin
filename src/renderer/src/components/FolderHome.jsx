import React from 'react';

/**
 * 已打开文件夹、但尚未打开任何文件时，主区的占位状态。
 *
 * 与 Welcome 的分工：
 * - Welcome 是「什么都没打开」的初始态，提供 新建 / 打开 / 打开文件夹 这些冷启动入口；
 * - 文件夹一旦打开成功，就不该再展示那些初始入口，否则用户点了「打开文件夹」
 *   却看不到任何变化。这里改而反映当前文件夹的状态（名称、路径、后续操作指引）。
 */
export default function FolderHome({ folderPath, fileCount, onReveal, onCloseFolder }) {
  const name = folderPath ? folderPath.split('/').pop() : '';
  const isEmpty = !fileCount;

  return (
    <div className="folder-home">
      <div className="folder-home-inner">
        <div className="folder-home-name" title={folderPath}>
          {name}
        </div>
        <div className="folder-home-path">{folderPath}</div>

        <div className="folder-home-hint">
          {isEmpty
            ? '该文件夹下暂无内容，可在左侧空白处右键新建文件。'
            : '从左侧文件树选择一个文件开始编辑。'}
        </div>

        <div className="folder-home-actions">
          <button type="button" onClick={onReveal}>
            在 Finder 中显示
          </button>
          <button type="button" onClick={onCloseFolder}>
            关闭文件夹
          </button>
        </div>
      </div>
    </div>
  );
}
