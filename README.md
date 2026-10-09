 龙没有耳朵

一个无需后端、可直接部署到 GitHub Pages 的网址文字收集器。

## 功能

- 添加网址、显示文字和备注
- 每条网址独立启用/停用，也可以一键切换全部状态
- 支持打开、复制和删除
- 支持上传 `.txt`、`.csv`、`.json` 批量导入
- 支持导出 JSON 备份
- 使用浏览器 `localStorage` 保存数据
- 纯 HTML、CSS、JavaScript，无构建步骤、无第三方依赖

## 批量导入格式

文本文件每行写一条，推荐使用下面的格式：

```text
学习资料 | https://example.com
项目仓库 | https://github.com
```

也支持 JSON 数组：

```json
[
  {"title": "项目仓库", "url": "https://github.com", "note": "代码协作", "active": true}
]
``` 
