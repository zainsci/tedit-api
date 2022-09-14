import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotAcceptable, throwNotFound, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const router = express.Router()

/**
 * Route for a Posts with :id
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get(
  "/:postId",
  async (
    req: Request<{ postId: string }, {}, {}, { username: string }>,
    res: Response
  ) => {
    const { postId } = req.params
    const { username } = req.query

    const id = parseInt(postId, 10)
    if (!id) return throwNotFound(res, `Post with ID: ${id} doesn't exist`)

    const post = await prisma.post.findFirst({
      where: { id },
      include: {
        author: { select: { username: true } },
        group: { select: { name: true } },
        _count: {
          select: { upvotes: true, downvotes: true, comments: true },
        },
        upvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
        downvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
      },
    })
    if (!post) return throwNotFound(res, `Post not found`)

    return res.json(post)
  }
)

/**
 * Route for getting 10 Posts at a time
 * Used for pagination using ?pageNo=1
 * @name /posts/
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get(
  "/",
  async (
    req: Request<{}, {}, {}, { pageNo: string; username: string }>,
    res: Response
  ) => {
    const { pageNo, username } = req.query

    console.log(username)

    let num = parseInt(pageNo)
    let posts

    if (!num) num = 1
    const skip = (num - 1) * 10

    posts = await prisma.post.findMany({
      take: 10,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true } },
        group: { select: { name: true } },
        _count: {
          select: { upvotes: true, downvotes: true, comments: true },
        },
        upvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
        downvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
      },
    })

    return res.json(posts)
  }
)

/**
 * Route for getting all Posts in a Group
 * @name /posts/user/:username
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get(
  "/user/:username",
  async (
    req: Request<{ username: string }, {}, {}, { pageNo: string }>,
    res: Response
  ) => {
    const { username } = req.params
    const { pageNo } = req.query

    let num = parseInt(pageNo)
    if (!num) num = 1
    const skip = (num - 1) * 10

    const posts = await prisma.post.findMany({
      take: 10,
      skip,
      orderBy: { createdAt: "desc" },
      where: {
        author: { username },
      },
      include: {
        author: { select: { username: true } },
        group: { select: { name: true } },
        _count: {
          select: { upvotes: true, downvotes: true, comments: true },
        },
        upvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
        downvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
      },
    })

    res.json(posts)
  }
)

/**
 * Route for getting all Posts in a Group
 * @name /posts/:groupname
 * @function
 * @memberof module:routes/post~postRouter
 */
router.get(
  "/group/:groupname",
  async (
    req: Request<
      { groupname: string },
      {},
      {},
      { pageNo: string; username: string }
    >,
    res: Response
  ) => {
    const { groupname } = req.params
    const { pageNo, username } = req.query

    let num = parseInt(pageNo)
    if (!num) num = 1
    const skip = (num - 1) * 10

    const posts = await prisma.post.findMany({
      take: 10,
      skip,
      orderBy: { createdAt: "desc" },
      where: {
        group: { name: groupname },
      },
      include: {
        author: { select: { username: true } },
        group: { select: { name: true } },
        _count: {
          select: { upvotes: true, downvotes: true, comments: true },
        },
        upvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
        downvotes: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
      },
    })

    res.json(posts)
  }
)

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

/**
 * UpVote a Post
 * @name /posts/:postId/vote/up
 * @function
 * @memberof module:routes/post~postRouter
 */
router.post(
  "/:postId/vote/up",
  async (
    req: Request<{ postId: string }, {}, { token: string }>,
    res: Response
  ) => {
    const { postId } = req.params

    const id = parseInt(postId, 10)
    if (!id) return throwNotFound(res, `Post with ID: ${id} doesn't exist`)

    const user = res.locals.user

    let post
    try {
      post = await prisma.post.update({
        where: { id },
        data: {
          upvotes: {
            connect: {
              id: user.id,
            },
          },
        },
        select: {
          downvotes: {
            where: {
              id: user.id,
            },
            select: {
              id: true,
              username: true,
            },
          },
        },
      })

      if (post.downvotes[0].id === user.id) {
        console.log("HERE")
        post = await prisma.post.update({
          where: { id },
          data: {
            downvotes: {
              disconnect: {
                id: user.id,
              },
            },
          },
          select: {
            downvotes: {
              where: { id: user.id },
              select: {
                username: true,
              },
            },
            upvotes: {
              where: { id: user.id },
              select: {
                username: true,
              },
            },
          },
        })
      }
    } catch (e) {}

    return res.json(post)
  }
)

/**
 * DownVote a Post
 * @name /posts/:postId/vote/down
 * @function
 * @memberof module:routes/post~postRouter
 */
router.post(
  "/:postId/vote/down",
  async (
    req: Request<{ postId: string }, {}, { token: string }>,
    res: Response
  ) => {
    const { postId } = req.params

    const id = parseInt(postId, 10)
    if (!id) return throwNotFound(res, `Post with ID: ${id} doesn't exist`)

    const user = res.locals.user

    let post
    try {
      post = await prisma.post.update({
        where: { id },
        data: {
          downvotes: {
            connect: {
              id: user.id,
            },
          },
        },
        select: {
          upvotes: {
            where: {
              id: user.id,
            },
            select: {
              id: true,
              username: true,
            },
          },
        },
      })

      if (post.upvotes[0].id === user.id) {
        post = await prisma.post.update({
          where: { id },
          data: {
            upvotes: {
              disconnect: {
                id: user.id,
              },
            },
          },
          select: {
            downvotes: {
              where: {
                id: user.id,
              },
              select: {
                username: true,
              },
            },
            upvotes: {
              where: { id: user.id },
              select: {
                username: true,
              },
            },
          },
        })
      }
    } catch (e) {}

    return res.json(post)
  }
)

export default router
