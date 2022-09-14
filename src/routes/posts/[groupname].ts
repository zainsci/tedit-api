import { Request, Response } from "express"

import prisma from "../../prisma/client"
import { throwNotAcceptable, throwNotFound } from "../../utils"

/**
 * Get Posts of a Group
 * Max 10 Posts per request
 * @method GET
 * @name /posts/:groupname
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function getPostsWithGroupName(
  req: Request<
    { groupname: string },
    {},
    {},
    { pageNo: string; username: string }
  >,
  res: Response
) {
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

/**
 * Post a Post to a Group
 * @method POST
 * @name /posts/:groupname
 * @function
 * @memberof module:routes/post~postRouter
 */
export async function postPostToAGroup(
  req: Request<
    { groupname: string },
    {},
    { title: string; body: string; token: string }
  >,
  res: Response
) {
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

export default {
  getPostsWithGroupName,
  postPostToAGroup,
}
