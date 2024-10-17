const path = require('node:path')
const fs = require('node:fs')
const multer = require('multer')
const express = require('express')

const router = express.Router()
const chunkPathMap = new Map()

const fileFilter = (req, file, cb) => {
  cb(null, true)
}

const uploadDir = path.resolve(__dirname, '../../uploads3')

const storage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // 判断文件夹是否存在，不存在则创建
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir)
      }
      cb(null, uploadDir)
    },
    // 仅仅用 Date.now() 是不够的，文件可能会重名，所以需要加上 Math.round(Math.random() * 1e9)
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname +
          '-' +
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9)
      )
    },
  }),
  fileFilter,
})

router.post(
  '/chunk',
  storage.any(),
  function (req, res) {
    chunkPathMap.set(req.body.hash, req.files[0].path)
    res.json({
      message: '上传成功',
    })
  },
  (err, req, res, next) => {
    console.log('🚀 ~ err:', err)
  }
)

router.post('/merge', async (req, res) => {
  const { filename, totalChunks, size } = req.body
  const filePath = path.resolve(uploadDir, `${filename}`)

  if (chunkPathMap.size !== totalChunks) {
    return res.status(400).json({ message: '文件块数量不正确' })
  }

  // 写入文件流
  const pipeStream = (chunkPath, writeStream) =>
    new Promise((resolve) => {
      const readStream = fs.createReadStream(chunkPath)
      readStream.on('end', () => {
        fs.unlinkSync(chunkPath)
        resolve()
      })
      readStream.pipe(writeStream)
    })

  try {
    // 并发写入文件
    await Promise.all(
      Array.from(chunkPathMap)
        .map(([hash, chunkPath]) => [Number(hash.split('-').pop()), chunkPath])
        .sort((a, b) => {
          return a[0] - b[0]
        })
        .map(([index, chunkPath]) =>
          pipeStream(
            chunkPath,
            fs.createWriteStream(filePath, { start: index * size })
          )
        )
    )
    // 清空 chunkPathMap
    chunkPathMap.clear()
    res.json({ message: '文件合并成功' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: '合并文件时发生错误', error: err })
  }
})

module.exports = router
