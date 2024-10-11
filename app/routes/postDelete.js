const express = require('express')
const router = express.Router()

const { prisma } = require('../prisima')
const { authenticate } = require('../middlewares/authenticate')
const { checkPostId } = require('../middlewares/checkPostId')

router.delete('/:post_id', authenticate, checkPostId, async (req, res) => {
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

    await prisma.posts.delete({
      where: { post_id: req.params.post_id },
    })

    res.status(200).json({
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error(error)
    res.status(500).send('Server Error')
  }
})

module.exports = router
