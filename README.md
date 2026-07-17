# ERP14 SCUM 服务器网页

这是 ERP14 SCUM 服务器展示页和配套后台接口项目。

## 项目入口

- 前台网页：`erp14-server-showcase.html`
- 后端服务：`backend/server.js`
- 配置示例：`erp14-site-config.example.json`
- 维护说明：`ERP14-维护说明.md`
- 代码地图：`代码地图.md`
- 部署说明：`部署说明.md`
- 回滚说明：`回滚说明.md`

## 当前接手状态

- C 盘 `C:\Users\Administrator\Desktop\SCUM用户网页`：开发、测试和预览副工作区。
- O 盘 `O:\AI\Open AI_Codex\SCUM用户网页`：验收后同步、归档和部署主工作区。
- `C:\Users\Administrator\Documents\SCUM网页`：废弃目录，不作为源码或验证目录。
- 第 1 至第 10 项已在 C 盘完成；尚未执行 O 盘同步和正式服务器部署。

## 本地运行后端

进入后端目录：

```bash
cd backend
```

启动：

```bash
NODE_ENV=production ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD_HERE" JWT_SECRET="YOUR_RANDOM_LONG_SECRET_HERE" PORT=3000 node server.js
```

说明：

- `ADMIN_PASSWORD` 是后台登录密码。
- `JWT_SECRET` 是 JWT 签名密钥，必须使用随机长字符串。
- `PORT` 是后端端口，默认 `3000`。

## 上线注意

- 不要把真实密码、Token、数据库连接地址提交到 GitHub。
- `backend/data/` 是运行数据目录，正式环境应在服务器保存或迁移到数据库。
- `backend/uploads/` 是上传图片目录，正式环境应在服务器保存或迁移到对象存储。
- `.env`、数据库、上传图片和备份不得提交 GitHub。
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
