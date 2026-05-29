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

## 功能特点

- **Markdown** 渲染支持
- 可以勾选的 TODO 列表
- 多种主题可选

## TODO 示例

- [x] 完成项目初始化
- [ ] 学习 Markdown 语法
- [ ] 尝试切换主题

> Slide Note — 边看 Slides 边做笔记

祝你使用愉快！`,
  },
}

export default zh
export type Translations = typeof zh
