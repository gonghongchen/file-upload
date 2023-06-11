const express = require('express')
const multer = require('multer')
const cors = require('cors')
const moment = require('moment')
const path = require('path')
const fs = require('fs-extra')
const app = express()
// const http = require('http')
// const server = http.createServer(app)
// const io = require('socket.io')(server, {
//   cors: {
//     origin: "http://127.0.0.1:6661",
//     methods: ["GET", "POST"]
//   }
// })

app.use(express.json()) // 解析请求体中的 JSON 数据

const whitelist = ['http://file.gonghongchen.com/']
const corsOptions = {
  origin(origin, callback) {
    // if (process.env.NODE_ENV === 'development' || whitelist.includes(origin)) {
      callback(null, true)
    // } else {
    //   callback(new Error('Not allowed by CORS'))
    // }
  }
}
app.use(cors(corsOptions)) // 接口请求跨域处理

// 设置上传的目录和文件名
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, req.query.path)) // 设置上传的目录
  },
  filename: (req, file, cb) => {
    // 处理中文文件名乱码的问题
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    )
    cb(null, file.originalname) // 设置上传的文件名
  }
})

// 创建一个 multer 实例
const upload = multer({ storage })

// 文件上传
app.post('/upload', upload.array('files', 10), (req, res, next) => {
// app.post('/upload', upload.single('file'), (req, res, next) => {
  const file = req.files
  
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }

  res.send('File uploaded successfully')
})

// 请求文件列表
const rootPath = '../uploads'
app.get('/getFilesList', async (req, res) => {
  const curPath = decodeURIComponent(req.query.path) || rootPath

  const files = await fs.readdirSync(path.resolve(__dirname, curPath), { withFileTypes: true })
  const fileList = files.map(file => {
    const { name } = file
    const isFile = file.isFile()
    const data = {
      isFile,
      name,
    }
    
    if (isFile) { // 如果是文件类型，则加上文件的创建时间和文件大小
      const { ctime, size } = fs.statSync(path.resolve(__dirname, curPath, name))
      const KB = size / 1024
      const MB = KB / 1024

      Object.assign(data, {
        time: moment(ctime).format('yyyy-MM-DD'),
        size: MB < 1 ? KB.toFixed(2) + 'K' : MB.toFixed(2) + 'M' // 大小的单位为 KB 或者 MB
      })
    }

    return data
  })

  res.status(200).send({
    code: 0,
    msg: '请求成功！',
    data: {
      isRootPath: curPath === rootPath,
      curPath,
      fileList,
    }
  })
})

// 新建文件夹
app.post('/createNewDir', async (req, res) => {
  const curPath = decodeURIComponent(req.body.path)

  try {
    await fs.mkdirSync(path.resolve(__dirname, curPath))

    res.send({
      code: 0,
      msg: '创建成功！',
      data: {}
    })
  } catch (error) {
    res.status(500).send({
      code: -1,
      msg: '创建失败！',
    })
  }
})

// 下载文件
app.get('/downloadFile', async (req, res) => {
  const { path: filePath, fileName } = req.query
  const curPath = decodeURIComponent(filePath)
  const dir = path.resolve(__dirname, curPath, fileName)
  
  // 发送文件内容
  res.sendFile(dir)
})

// 删除目录/文件
app.delete('/deleteFile', async (req, res) => {
  const { path: filePath, fileName } = req.query
  const curPath = decodeURIComponent(filePath)
  const dir = path.resolve(__dirname, curPath, fileName)
  
  try {
    await fs.removeSync(dir)

    res.send({
      code: 0,
      msg: '删除成功！',
      data: {}
    })
  } catch (error) {
    res.status(500).send({
      code: -1,
      msg: '删除失败！',
    })
  }
})

// 启动 socket.io
// io.on('connection', (socket) => {
//   console.log('A new connection has been established.')

//   // 当上传进度发生变化时，通知客户端
//   const emitProgress = (progress) => {
//     socket.emit('progress', { progress })
//   }
//   emitProgress(111)
// })

// 启动服务器
app.listen(6660, () => {
  console.log('Server started on port 6660')
})