# ERP14 SCUM 部署说明

本文档只记录本地项目和服务器的对应关系。执行上传、Git 推送、PM2 重启、Nginx 修改前，必须先单独确认。

## 服务器路径

| 类型 | 本地路径 | 服务器路径 |
| --- | --- | --- |
| 网站根目录 | `O:\AI\Open AI_Codex\SCUM用户网页` | `/www/wwwroot/ERP-SCUM` |
| 前端网页 | `erp14-server-showcase.html` | `/www/wwwroot/ERP-SCUM/erp14-server-showcase.html` |
| 后端目录 | `backend` | `/www/wwwroot/ERP-SCUM/backend` |
| 后端入口 | `backend/server.js` | `/www/wwwroot/ERP-SCUM/backend/server.js` |
| 后端配置数据 | `backend/data/site-config.json` | `/www/wwwroot/ERP-SCUM/backend/data/site-config.json` |
| 上传图片目录 | `backend/uploads` | `/www/wwwroot/ERP-SCUM/backend/uploads` |
| Nginx 站点配置 | 不在本地项目内 | `/www/server/panel/vhost/nginx/129.204.11.187.conf` |

## 可以随代码更新的文件

这些文件属于源码或说明，后续确认版本稳定后可以进入 Git，再由服务器拉取或按发布包上传：

- `erp14-server-showcase.html`
- `backend/server.js`
- `backend/package.json`
- `backend/test/`
- `erp14-site-config.example.json`
- `README.md`
- `CHANGELOG.md`
- `deploy/`

## 当前前端版本状态

当前本地有两个重要前端文件：

| 文件 | 当前用途 |
| --- | --- |
| `erp14-server-showcase.html` | C 盘已验收的单文件页面；尚未同步 O 盘，未部署服务器。 |
| `备份/部署前正式数据备份-20260716-192256/production-before-sync-20260716.html` | 同步前保留的生产页备份，不能删除。 |

重要规则：

- 日常继续优化网页时，修改 `erp14-server-showcase.html`。
- 在你确认新版已经定稿前，不要把 `erp14-server-showcase.html` 上传服务器。
- 如果需要恢复同步前页面，使用部署前备份，并先核对备份大小和 SHA256 记录。
- 整理文件夹时，这个稳定版备份不要删除。

## 不要随便覆盖服务器的文件

这些是运行数据或环境配置，通常由服务器自己保存。更新代码时不要直接覆盖：

- `backend/data/site-config.json`
- `backend/data/event-signups.json`
- `backend/uploads/`
- `.env`
- `backend/.env`
- Nginx 站点配置
- PM2 运行状态

## PM2 服务

当前后端 PM2 服务名：

```bash
erp-scum-backend
```

代码更新后如需重启，应在确认服务器文件无误后再执行：

```bash
pm2 restart erp-scum-backend
```

## 发布脚本

当前有两个发布脚本：

```text
deploy/build-code-release-package.ps1
deploy/build-full-restore-package.ps1
```

`build-code-release-package.ps1` 生成代码发布包，输出到：

```text
发布区/代码发布包/当前版本
```

代码发布包只包含：

- `erp14-server-showcase.html`
- `backend/server.js`
- `backend/package.json`

代码发布包不包含 `backend/data/` 和 `backend/uploads/`，适合以后只更新前后端代码。

`build-full-restore-package.ps1` 生成完整恢复包，输出到：

```text
发布区/完整恢复包/当前版本
```

完整恢复包包含：

- `erp14-server-showcase.html`
- `backend/server.js`
- `backend/package.json`
- `backend/data/`
- `backend/uploads/`

完整恢复包适合整站迁移或灾难恢复，不适合在服务器已有最新运行数据时直接覆盖上传。

## 推荐发布流程

1. 本地完成前端或后端修改。
2. 本地检查页面和后端测试。
3. 如果本次涉及前端，确认 `erp14-server-showcase.html` 已经达到你要的定稿效果。
4. 确认 `backend/data/` 和 `backend/uploads/` 没有被误加入 Git。
5. 如只是更新前后端代码，运行 `deploy/build-code-release-package.ps1`。
6. 版本稳定后再提交 Git。
7. 服务器先备份，再拉取或上传代码文件。
8. 如修改了后端代码，再重启 `erp-scum-backend`。
9. 打开网页确认前端显示和接口正常。

## 当前注意事项

- 当前 C 盘已完成隔离部署演练；O 盘同步和正式服务器部署仍需总裁单独确认。
- 正式环境必须通过 `JWT_SECRET` 和 `ADMIN_PASSWORD` 配置真实值，代码、Git、日志和文档不得保存真实凭据。
- 2026-07-05：旧结构发布包已归档到 `发布区/旧结构发布包/当前版本-20260705-0119`。
- `发布区/` 是本地生成的上传包目录，不进入 Git。
- `备份/` 是本地备份目录，不进入 Git。
