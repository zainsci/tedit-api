import { Request, Response } from "express"

import prisma from "../../prisma/client"
import { throwNotFound } from "../../utils"

/**
 * UpVote a Post
 * @method POST
 * @name /posts/:postId/vote/up
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function postAnUpvoteWithId(
  req: Request<{ postId: string }, {}, { token: string }>,
  res: Response
) {
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

/**
 * DownVote a Post
 * @method POST
 * @name /posts/:postId/vote/down
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function postADownvoteWithId(
  req: Request<{ postId: string }, {}, { token: string }>,
  res: Response
) {
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

export default {
  postAnUpvoteWithId,
  postADownvoteWithId,
}
