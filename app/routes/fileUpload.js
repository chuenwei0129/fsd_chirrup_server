const fs = require('node:fs')
const path = require('node:path')
const { promisify } = require('node:util')
const multer = require('multer')
const express = require('express')

const router = express.Router()

// 文件上传
// 用 multer 处理文件上传，指定保存目录为 uploads
const storage1 = multer({ dest: path.resolve(__dirname, '../../uploads1') })

router.post('/file', async (req, res) => {
  const uploadSingleFilePromise = promisify(storage1.single('file'))
  try {
    await uploadSingleFilePromise(req, res)
    // 文件上传成功后，req.file 对象将包含有关上传文件的信息，例如文件名、文件大小、文件类型等。
    console.log('req.file', req.file)
    res.status(200).json({ message: '文件上传成功', file: req.file })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ message: '文件上传失败' })
  }
})

router.post(
  '/files',
  storage1.array('files', 3),
  (req, res) => {
    console.log('req.files', req.files)
    // 其他非文件字段，同样是通过 req.body 来取。
    console.log('req.body', req.body)
    res.status(200).json({ message: '文件上传成功', files: req.files })
  },
  // 当你移除了 next 参数，Express 不再将其识别为一个错误处理中间件。错误处理中间件需要四个参数才能正确工作。如果参数少于四个，Express会将其视为普通的中间件，而不是专门用来处理错误的中间件。这就是为什么当你移除 next 后，错误处理不能正确地捕捉到特定的错误（如文件数量超出限制的错误），并且总是执行到500错误处理部分的原因。
  // 即使你没有在函数体中使用 next 参数，你仍然需要在参数列表中包含它，以确保 Express 能正确识别并使用这个错误处理中间件。嘎。所以，正确的做法是保留 next 参数，即使你的代码逻辑中没有显式调用它。
  (err, req, res, next) => {
    if (
      err instanceof multer.MulterError &&
      err.code === 'LIMIT_UNEXPECTED_FILE'
    ) {
      // 处理超出文件数量限制的错误
      return res.status(400).json({ error: '文件数量超出限制' })
    }
    res.status(500).json({ error: '文件上传失败', details: err.message })
  }
)

// 一次处理多字段
router.post('/fields', async (req, res) => {
  try {
    await promisify(
      storage1.fields([
        { name: 'foo', maxCount: 3 },
        { name: 'bar', maxCount: 2 },
      ])
    )(req, res)
    res.json({
      message: '文件上传成功',
    })
  } catch (err) {
    if (
      err instanceof multer.MulterError &&
      err.code === 'LIMIT_UNEXPECTED_FILE'
    ) {
      // 处理超出文件数量限制的错误
      return res
        .status(400)
        .json({ error: `${err.field} 超出文件数量限制的错误` })
    }
    res.status(500).json({ error: '文件上传失败', details: err.message })
  }
})

// Field name 由表单指定
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4']
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Wrong file type')
    error.code = 'LIMIT_FILE_TYPES'
    return cb(error, false)
  }
  cb(null, true)
}

// 设置文件过滤和限制
const storage2 = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        fs.mkdirSync(path.resolve(__dirname, '../../uploads2'))
      } catch {}
      cb(null, path.resolve(__dirname, '../../uploads2'))
    },
    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() +
        '-' +
        Math.round(Math.random() * 1e9) +
        '-' +
        file.originalname
      cb(null, file.fieldname + '-' + uniqueSuffix)
    },
  }),
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1000, // 1000 MB
  },
})

router.post(
  '/media',
  storage2.any(),
  function (req, res) {
    console.log('Files:', req.files)
    console.log('Non-file fields:', req.body)
    res.json({
      message: '上传成功',
    })
  },
  (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_TYPES') {
      res.status(422).json({ error: '只允许上传 JPEG, PNG, MP4 文件' })
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(422).json({ error: '文件太大' })
    }
  }
)

module.exports = router
