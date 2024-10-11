const express = require('express')
const router = express.Router()

const { authenticate } = require('../middlewares/authenticate')
const { prisma } = require('../prisima')
const { checkUserId } = require('../middlewares/checkUserId')

// A follower is someone who follows you & a following is someone you follow.
// The logged in user will follow the user at a given ID.
router.post('/:user_id/follow', authenticate, checkUserId, async (req, res) => {
  const userIdYouWantToFollow = req.params.user_id

  // Should return 404 when trying to follow a user that does not exist in the application
  const userIdYouWantToFollowIsExisting = await prisma.users.findUnique({
    where: {
      user_id: userIdYouWantToFollow,
    },
  })

  if (!userIdYouWantToFollowIsExisting) {
    return res.status(404).send('User You Want Follow not found')
  }

  try {
    const existingFollow = await prisma.followers.findFirst({
      where: {
        user_id: req.currentLoginUser.user_id,
        follower_id: userIdYouWantToFollow,
      },
    })

    if (existingFollow) {
      return res.status(403).send('You have already follow this user')
    }

    await prisma.followers.create({
      data: {
        user_id: req.currentLoginUser.user_id,
        follower_id: userIdYouWantToFollow,
      },
    })

    res.status(200).send({
      user_id: req.currentLoginUser.user_id,
      session_token: req.currentLoginUser.session_token,
    })
  } catch (error) {
    res.status(500).send('Server Error')
  }
})

// The logged in user will stop following the user at a given ID.
router.delete(
  '/:user_id/follow',
  authenticate,
  checkUserId,
  async (req, res) => {
    const userIdYouWantToUnFollow = req.params.user_id

    try {
      // Should return 404 when trying to follow a user that does not exist in the application
      const userIdYouWantToUnFollowIsExisting = await prisma.users.findUnique({
        where: {
          user_id: userIdYouWantToUnFollow,
        },
      })

      if (!userIdYouWantToUnFollowIsExisting) {
        return res.status(404).send('User You Want UnFollow not found')
      }

      const existingFollow = await prisma.followers.findFirst({
        where: {
          user_id: req.currentLoginUser.user_id,
          follower_id: userIdYouWantToUnFollow,
        },
      })

      if (!existingFollow) {
        return res
          .status(403)
          .send('You can not unfollow a user that you are not following')
      }

      await prisma.followers.deleteMany({
        where: {
          user_id: existingFollow.user_id,
          follower_id: existingFollow.follower_id,
        },
      })

      res.status(200).send('User unfollow successfully')
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
