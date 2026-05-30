const zh = {
  app: {
    title: 'Slide Note',
    dockedLabel: 'Slide Note',
    dockedTooltip: '点击展开 / 拖拽移动',
  },
  titlebar: {
    toggleSidebar: '侧边栏',
    dock: '吸附到边栏',
    undock: '展开窗口',
    minimize: '最小化',
    maximize: '最大化',
    close: '关闭',
  },
  sidebar: {
    newNote: '+ 新建便签',
    searchPlaceholder: '搜索便签...',
    sortLabel: '排序：',
    sortModified: '修改时间',
    sortCreated: '创建时间',
    sortWords: '字数',
    sortTitle: '首字母',
    noNotes: '暂无便签',
    untitled: '无标题',
    confirmDelete: '确定删除此便签？',
    needOneNote: '至少保留一个便签',
    settings: '设置',
    richText: '富文本',
    newFolder: '+ 新建文件夹',
    deleteNote: '删除便签',
    addToFolder: '添加到文件夹',
    removeFromFolder: '移出文件夹',
    folderNamePlaceholder: '文件夹名称',
    selectFolder: '选择文件夹',
    batchDelete: '批量删除',
    multiSelect: '多选模式',
    confirmDeleteNotes: '确定删除选中的 {count} 条便签？',
    noFolders: '暂无文件夹',
  },
  editor: {
    placeholder: '开始写作... 支持 Markdown 格式',
    empty: '选择一个便签或创建新的便签',
    preview: '预览 Markdown',
    edit: '切换到编辑',
  },
  toolbar: {
    heading: '标题',
    bold: '粗体',
    italic: '斜体',
    code: '代码',
    list: '列表',
    todo: '待办事项',
    quote: '引用',
    link: '链接',
    fontSize: '字体大小',
    fontBold: '加粗',
    fontColor: '字体颜色',
    switchTheme: '切换主题',
  },
  theme: {
    cyberpunk: '赛博朋克',
    nature: '自然',
    medieval: '中世纪',
  },
  settings: {
    title: '设置',
    dataPathLabel: '数据存储路径',
    save: '保存',
    pathHint: '✅ 路径已保存，数据已迁移',
    pathHint2: '当前数据仍在原位置，如需迁移请手动复制。',
    currentPath: '当前路径：',
    languageLabel: '界面语言',
    languageHint: '切换后立即生效',
  },
  insert: {
    boldText: '粗体文字',
    italicText: '斜体文字',
    headingText: '标题',
    listItem: '列表项',
    todoItem: '待办事项',
    quoteText: '引用文字',
    codeText: '代码',
    linkText: '链接文字',
  },
  outline: {
    title: '大纲',
    empty: '暂无标题\n使用 # 添加标题以生成大纲',
    toggleTooltip: '切换大纲面板',
  },
  welcome: {
    title: '欢迎使用 Slide Note',
    content: `# 欢迎使用 Slide Note! 🎉

Slide Note 是一款桌面便签应用，始终置顶，支持 Markdown 和富文本双编辑模式。

## ✨ 核心功能

- **📝 双编辑模式** — Markdown 源码编辑 / Slate 富文本编辑，一键互转
- **☑ TODO 待办列表** — 使用 \`- [ ]\` 创建任务，点击复选框直接勾选/取消
- **🎨 三套主题** — 赛博朋克 / 自然 / 中世纪，右上角齿轮切换
- **📋 大纲导航** — 点击标题栏 ☷ 图标打开大纲面板，按标题层级快速跳转
- **📌 屏幕吸附** — 拖拽窗口到屏幕边缘自动吸附，点击展开

## ⌨ 快捷操作

| 操作 | 方式 |
|------|------|
| 新建便签 | 侧栏 + 按钮 |
| 搜索便签 | 侧栏搜索框 |
| 排序便签 | 侧栏下拉菜单（时间/字数/首字母）|
| 切换主题 | 工具栏最右侧下拉 |
| 吸附/展开 | \`Ctrl+Shift+D\` 或标题栏 ◀ 按钮 |
| 切换大纲 | 标题栏 ☷ 按钮 |
| Md ↔ 富文本 | 工具栏 MD / 📝 按钮 |
| 字体/颜色 | 工具栏右侧下拉和色块 |

## 📂 数据存储

每条便签独立存储为 JSON 文件（\`data-path/notes/<id>.json\`），便于备份、Git 管理和迁移。

> 💡 提示：在设置中可自定义数据存储路径。

## 🔗 项目链接

[GitHub Link](https://github.com/hchen272/SlideNote)

---

祝你使用愉快！`,
  },
}

export default zh
export type Translations = typeof zh
