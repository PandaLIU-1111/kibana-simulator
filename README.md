# Kibana模拟器

这个项目是一个简化版的Kibana模拟器，提供了一个无需登录即可操作Elasticsearch的Web界面。用户可以自行输入Elasticsearch的URL、用户名和密码，连接到任意Elasticsearch实例进行操作。

## 功能特点

- 无需登录即可使用，只需提供ES连接信息
- 支持查看集群状态和索引信息
- 提供数据探索功能，可搜索索引中的文档
- 提供开发工具控制台，可执行任意ES API请求
- 支持索引管理功能，可创建、删除、开关索引

## 技术栈

- 前端：React, Bootstrap, Axios
- 后端：Node.js, Express
- 开发工具：Webpack, Babel, Nodemon

## 安装使用

### 前提条件

- Node.js 14.x 或更高版本
- npm 6.x 或更高版本
- 可连接的Elasticsearch实例（本地或远程）

### 安装步骤

1. 克隆或下载本项目
2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client && npm install
```

3. 启动开发服务器

```bash
# 在根目录运行
npm run dev
```

这将同时启动前端开发服务器（端口3000）和后端API服务器（端口5001）。

4. 在浏览器中访问 `http://localhost:3000`

### 构建生产版本

```bash
# 构建前端资源
npm run build

# 启动生产服务器
npm start
```

## 使用说明

1. 首次访问页面时，需要输入Elasticsearch连接信息：
   - ES服务器URL（例如：http://localhost:9200）
   - 用户名（可选）
   - 密码（可选）

2. 连接成功后，可以使用以下功能：
   - 仪表盘：查看ES集群状态和索引概览
   - 数据探索：搜索索引中的文档
   - 开发工具：直接执行ES API请求
   - 索引管理：管理索引的生命周期

## 注意事项

- 本应用主要用于开发和测试环境，不建议在生产环境直接使用
- 所有操作直接作用于连接的ES实例，请谨慎使用删除等危险操作
- 本应用不存储任何连接信息，刷新页面后需要重新连接

## 许可证

ISC 