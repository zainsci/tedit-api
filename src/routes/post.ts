import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotAcceptable, throwNotFound, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const router = express.Router()

/**
 * Route for getting 10 Posts at a time
 * Used for pagination using ?pageNo=1
 * @name /posts/
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get(
  "/",
  async (req: Request<{}, {}, {}, { pageNo: string }>, res: Response) => {
    const { pageNo } = req.query

    const num = parseInt(pageNo)
    let posts

    if (!num) {
      posts = await prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    } else {
      const skip = (num - 1) * 10

      posts = await prisma.post.findMany({
        take: 10,
        skip,
        orderBy: { createdAt: "desc" },
      })
    }

    return res.json(posts)
  }
)

/**
 * Route for getting all Posts in a Group
 * @name /posts/:groupname
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get("/:groupname", async (req: Request, res: Response) => {
  const { groupname } = req.params

  const posts = await prisma.post.findMany({
    where: {
      group: { name: groupname },
    },
  })

  if (posts.length == 0)
    return throwNotFound(res, `Group with name ${groupname} doesn't exist!`)

  res.json(posts)
})

/**
 * Auth Middleware for
 * verifying User JWT token
 * Assigns res.locals.user
 */
router.use(verifyUser)

/**
 * Route for posting a Post to a Group
 * @name /posts/:groupname
 * @function
 * @memberof module:routes/post~postRouter
 */
router.post(
  "/:groupname",
  async (
    req: Request<
      { groupname: string },
      {},
      { title: string; body: string; token: string }
    >,
    res: Response
  ) => {
    const { groupname } = req.params
    const { title, body } = req.body

    if (title.length <= 0)
      return throwNotAcceptable(res, "Title must be of lenght bigger than 0!")

    const user = res.locals.user
    const group = await prisma.group.findFirst({
      where: { name: groupname },
    })

    if (!group)
      return throwNotFound(res, `Group with name ${groupname} doesn't exist`)

    try {
      const newPost = await prisma.post.create({
        data: {
          title,
          body,
          authorId: user.id,
          groupId: group.id,
        },
      })

      return res.json(newPost)
    } catch (e) {
      return res.status(500).json({
        message: "New post creation failed!",
      })
    }
  }
)

/**
 * Route for updating a Post
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
router.put(
  "/:id",
  async (
    req: Request<
      { id: string },
      {},
      { token: string; title: string; body: string }
    >,
    res: Response
  ) => {
    const { id } = req.params
    const { token, title, body } = req.body

    const user = res.locals.user

    const post = await prisma.post.findFirst({
      where: { id: parseInt(id, 10) },
    })
    if (!post) return throwNotFound(res, `Post with ID ${id} doesn't exist!`)

    if (post.authorId !== user.id) {
      return throwUnauthorized(res, "Not Authorized")
    }

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: {
        title,
        body,
      },
    })

    return res.json(updatedPost)
  }
)

/**
 * Route for deleting a Post
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params

  const user = res.locals.user

  const post = await prisma.post.findFirst({
    where: { id: parseInt(id, 10) },
  })
  if (!post) return throwNotFound(res, `Post with ID ${id} doesn't exist!`)

  if (post.authorId !== user.id)
    return throwUnauthorized(res, "Not Authorized!")

  const delPost = await prisma.post.delete({
    where: {
      id: post.id,
    },
  })

  return res.json(delPost)
})

export default router
