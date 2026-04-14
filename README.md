# 基于多模态简历解析与岗位匹配的职业预测系统

一个面向求职辅助场景的全流程系统，围绕“简历解析 -> 岗位匹配 -> 职业成长建议”提供可视化分析与可执行报告输出。

## 项目简介

本项目采用前后端分离架构：

- 前端：`Next.js + React + TypeScript`，提供职业分析可视化看板
- 后端：`FastAPI`，提供简历解析、岗位导入、岗位匹配等接口
- 数据层：`SQLite` 存储岗位与简历结构化结果

系统支持上传简历（PDF / DOCX / TXT），自动提取文本并构建候选人画像，结合岗位库生成匹配结果、能力评分、岗位画像、成长路线与转岗建议。

## 核心功能

- 简历解析：提取并结构化简历信息（基础信息、技能、项目、经历、求职意向）
- 岗位导入：支持 JSON 与 Excel（`.xlsx`）批量导入岗位数据
- 岗位匹配：结合硬条件与软匹配输出岗位排序
- 职业报告：输出能力评估、岗位画像、成长路径、行动建议
- 前端看板：支持首页总览、岗位详情、成长阶段详情等页面
- 回退机制：后端不可用时，前端可回退到演示数据模式

## 技术栈

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic, Uvicorn
- Parsing: pypdf, docx(XML) parsing, openpyxl
- Storage: SQLite
- Optional LLM: DeepSeek（可选，不配置也可运行）

## 项目结构

```text
CareerPredict-main/
├─ app/                    # Next.js 路由页面
├─ components/             # 前端组件
├─ lib/                    # 前端 API 与数据映射
├─ backend/
│  ├─ app/
│  │  ├─ api/routes/       # FastAPI 路由
│  │  ├─ services/         # 解析、匹配、报告服务
│  │  ├─ schemas/          # Pydantic 数据模型
│  │  └─ core/             # 配置与数据库初始化
│  ├─ data/                # SQLite 数据文件目录
│  ├─ requirements.txt
│  └─ sample_jobs.json
├─ jobs.json               # 示例岗位数据
└─ job.xlsx                # 示例岗位表格
```

## 快速开始

### 1) 启动后端（FastAPI）

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端默认地址：`http://127.0.0.1:8000`

### 2) 启动前端（Next.js）

```bash
cd ..
npm install
npm run dev
```

前端默认地址：`http://127.0.0.1:3000`

## 环境变量

### 前端（根目录 `.env.local`）

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ENABLE_API_FALLBACK=true
```

### 后端（`backend/.env`，可选）

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_SECONDS=30
```

不配置 DeepSeek 也可以完整运行，系统会使用规则化逻辑生成报告内容。

## 主要接口

- `GET /api/v1/health`：服务健康检查
- `POST /api/v1/resume/parse`：简历解析
- `POST /api/v1/jobs/import`：导入 JSON 岗位数据
- `POST /api/v1/jobs/import-excel`：导入 Excel 岗位数据（仅 `.xlsx`）
- `GET /api/v1/jobs`：查询岗位列表
- `GET /api/v1/resumes`：查询已解析简历
- `POST /api/v1/match/resume-to-jobs`：简历与岗位匹配

`match` 关键表单字段：

- `file`：简历文件
- `target_role`：目标岗位
- `notes`：补充说明
- `limit`：返回岗位数量

## 典型使用流程

1. 启动后端与前端服务
2. 导入岗位数据（`jobs.json` 或 `job.xlsx`）
3. 上传简历并输入目标岗位
4. 生成分析报告并查看匹配岗位
5. 根据成长路径与行动计划迭代简历与投递策略

## 注意事项

- 后端当前实际支持：`PDF / DOCX / TXT`（不直接支持 `.doc`）
- Excel 导入仅支持 `.xlsx`
- 建议先导入岗位库再做匹配，否则推荐结果有限
- 若直接刷新某些详情页，可能丢失上下文快照（属于当前前端状态设计）
- 建议在本地受控环境运行，避免上传敏感隐私数据到未授权服务
