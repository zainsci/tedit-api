import { Request, Response } from "express"
import prisma from "../../prisma/client"

/**
 * Get Posts
 * Max 10 Posts per request
 * ?pageNo for pagination
 * ?username for getting user's
 * detail on the post like upvote etc
 * @method GET
 * @name /posts/
 * @function
 * @memberof module:routes/post~postRouter
 */
export default async function get10Posts(
  req: Request<{}, {}, {}, { pageNo: string; username: string }>,
  res: Response
) {
  const { pageNo, username } = req.query

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
