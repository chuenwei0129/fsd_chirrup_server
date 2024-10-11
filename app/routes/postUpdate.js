const express = require('express')
const router = express.Router()

const { prisma } = require('../prisima')
const { authenticate } = require('../middlewares/authenticate')
const { checkPostId } = require('../middlewares/checkPostId')
const { checkText } = require('../middlewares/checkText')

router.patch(
  '/:post_id',
  authenticate,
  checkPostId,
  checkText,
  async (req, res) => {
    const { text } = req.body

    try {
      const post = await prisma.posts.findUnique({
        where: { post_id: req.params.post_id },
      })

      if (!post) {
        return res.status(404).send('Post not found')
      }

      if (post.author_id !== req.currentLoginUser.user_id) {
        return res.status(403).send('Forbidden')
      }

      const updatedPost = await prisma.posts.update({
        where: { post_id: req.params.post_id },
        data: { text },
      })

      res.status(200).json(updatedPost)
    } catch (error) {
      console.error(error)
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
