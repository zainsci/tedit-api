import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotFound, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const router = express.Router()

/**
 * Get all Comments on a Post
 * @name /comments/:postId
 * @function
 * @memberof module:routes/comment~commentRouter
 */
router.get(
  "/:postId",
  async (req: Request<{ postId: string }>, res: Response) => {
    const { postId } = req.params

    const id = parseInt(postId, 10)
    if (!id) return throwNotFound(res, "No Comments for this Post")

    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
      },
    })

    return res.json(comments)
  }
)

/**
 * Auth Middleware for
 * verifying User JWT token
 * Assigns res.locals.user
 */
router.use(verifyUser)

/**
 * Add a Comment to a Post
 * @name /comments/:postId
 * @function
 * @memberof module:routes/comment~commentRouter
 */
router.post(
  "/:postId",
  async (
    req: Request<{ postId: string }, {}, { token: string; body: string }>,
    res: Response
  ) => {
    const { postId } = req.params
    const { body } = req.body

    const id = parseInt(postId, 10)
    if (!id) return throwNotFound(res, "Post doesn't exist")

    const user = res.locals.user

    const comment = await prisma.comment.create({
      data: {
        body,
        postId: id,
        authorId: user.id,
      },
    })

    return res.json(comment)
  }
)

/**
 * Update a Comment on a Post
 * @name /comments/:commentId
 * @function
 * @memberof module:routes/comment~commentRouter
 */
router.put(
  "/:commentId",
  async (
    req: Request<{ commentId: string }, {}, { token: string; body: string }>,
    res: Response
  ) => {
    const { commentId } = req.params
    const { body } = req.body

    const id = parseInt(commentId, 10)
    if (!id) return throwNotFound(res, "Comment doesn't exist")

    const user = res.locals.user

    const comment = await prisma.comment.findFirst({ where: { id } })
    if (!comment) return throwNotFound(res, "Comment doesn't exist")

    if (comment.authorId !== user.id)
      return throwUnauthorized(res, "Not Authorized!")

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        body,
      },
    })

    return res.json(updatedComment)
  }
)

/**
 * Delete a Comment from a Post
 * @name /comments/:commentId
 * @function
 * @memberof module:routes/comment~commentRouter
 */
router.delete(
  "/:commentId",
  async (
    req: Request<{ commentId: string }, {}, { token: string }>,
    res: Response
  ) => {
    const { commentId } = req.params

    const id = parseInt(commentId, 10)
    if (!id) return throwNotFound(res, "Comment doesn't exist")

    const user = res.locals.user

    const comment = await prisma.comment.findFirst({ where: { id } })
    if (!comment) return throwNotFound(res, "Comment doesn't exist")

    if (comment.authorId !== user.id)
      return throwUnauthorized(res, "Not Authorized!")

    const deletedComment = await prisma.comment.delete({
      where: { id },
    })

    return res.json(deletedComment)
  }
)

export default router
