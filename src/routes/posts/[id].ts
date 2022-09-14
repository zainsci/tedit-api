import { Request, Response } from "express"

import prisma from "../../prisma/client"
import { throwNotFound, throwUnauthorized } from "../../utils"

/**
 * Get Post with :id
 * @method GET
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function getPostWithId(
  req: Request<{ postId: string }, {}, {}, { username: string }>,
  res: Response
) {
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

/**
 * Update a Post with :id
 * @method PUT
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function putPostWithId(
  req: Request<
    { id: string },
    {},
    { token: string; title: string; body: string }
  >,
  res: Response
) {
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

/**
 * Delete a Post with :id
 * @method DELETE
 * @name /posts/:id
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function delPostWithId(
  req: Request<{ id: string }>,
  res: Response
) {
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
}

export default {
  getPostWithId,
  putPostWithId,
  delPostWithId,
}
