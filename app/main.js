const path = require('node:path')

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
const HTTP_PORT = 3333

// 日志记录
app.use(morgan('tiny'))

// 从 Express 版本 4.16+ 开始，默认 Express 软件包中包含了他们自己的 body-parser 实现，因此无需再额外安装 body-parser。
// 请求中间件
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// app.use(express.static(path.join(__dirname, 'public')))

// 路由
// User Management
app.use('/', require('./routes/auth'))

// Social Connection Management
app.use('/users', require('./routes/userRead'))
app.use('/users', require('./routes/userFollow'))
app.use('/', require('./routes/userSearch'))

// 针对任何其他未处理的请求，返回 404 状态码
app.use((_, res) => {
  res.sendStatus(404)
})

app.listen(HTTP_PORT, () => {
  console.log(`Server running at http://localhost:${HTTP_PORT}/`)
})
