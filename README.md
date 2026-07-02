# ERP14 SCUM 服务器网页

这是 ERP14 SCUM 服务器展示页和配套后台接口项目。

## 项目入口

- 前台网页：`erp14-server-showcase.html`
- 后端服务：`backend/server.js`
- 配置示例：`erp14-site-config.example.json`
- 维护说明：`ERP14-维护说明.md`

## 本地运行后端

进入后端目录：

```bash
cd backend
```

启动：

```bash
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD_HERE" ADMIN_TOKEN="YOUR_RANDOM_TOKEN_HERE" PORT=3000 node server.js
```

说明：

- `ADMIN_PASSWORD` 是后台登录密码。
- `ADMIN_TOKEN` 是后台接口令牌，建议使用随机长字符串。
- `PORT` 是后端端口，默认 `3000`。

## 上线注意

- 不要把真实密码、Token、数据库连接地址提交到 GitHub。
- `backend/data/` 是运行数据目录，正式环境应在服务器保存或迁移到数据库。
- `backend/uploads/` 是上传图片目录，正式环境应在服务器保存或迁移到对象存储。
- 上线后需要把前端接口地址从本地地址改成正式域名。

## 检查命令

后端测试：

```bash
cd backend
node --test
```

后端语法检查：

```bash
node --check backend/server.js
```
