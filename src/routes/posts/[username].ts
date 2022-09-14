import { Request, Response } from "express"

import prisma from "../../prisma/client"

/**
 * Get all Posts of a User
 * @method GET
 * @name /posts/user/:username
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function getPostsWithUsername(
  req: Request<{ username: string }, {}, {}, { pageNo: string }>,
  res: Response
) {
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

export default { getPostsWithUsername }
