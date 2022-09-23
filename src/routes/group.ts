import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotAcceptable, throwNotFound, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const router = express.Router()

/**
 * Get a list of five
 * latest Groups
 * @name /group/list
 * @function
 * @memberof module:routes/group~groupRouter
 */
router.get("/list", async (req: Request, res: Response) => {
  const groupList = await prisma.group.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  })

  return res.json(groupList)
})

/**
 * Get Group metadata and
 * check if the user joined
 * group or not
 * @name /group/:name
 * @function
 * @memberof module:routes/group~groupRouter
 */
router.get(
  "/:name",
  async (
    req: Request<{ name: string }, {}, {}, { username: string }>,
    res: Response
  ) => {
    const { name } = req.params
    let { username } = req.query

    if (typeof username === "undefined") username = ""

    const group = await prisma.group.findFirst({
      where: {
        name,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          where: {
            username,
          },
          select: {
            username: true,
          },
        },
      },
    })
    if (!group) return throwNotFound(res, "Group doesn't exist")

    return res.json(group)
  }
)

/**
 * Auth Middleware for
 * verifying User JWT token
 * Assigns res.locals.user
 */
router.use(verifyUser)

/**
 * Create a new Group
 * @name /group/create
 * @function
 * @memberof module:routes/group~groupRouter
 */
router.post(
  "/create",
  async (
    req: Request<{}, {}, { token: string; name: string; description: string }>,
    res: Response
  ) => {
    const { token, name, description } = req.body

    if (name.length <= 3) {
      throwNotAcceptable(res, "Group name should be of length 4 or above!")
    }

    const user = res.locals.user

    try {
      const newGroup = await prisma.group.create({
        data: {
          name,
          description,
          admins: { connect: { id: user.id } },
        },
      })

      return res.json(newGroup)
    } catch (e) {
      throwNotAcceptable(res, `The Group with name ${name} already exists!`)
    }
  }
)

/**
 * Update a Group description
 * @name /group/:name/description
 * @function
 * @memberof module:routes/group~groupRouter
 */
router.put(
  "/:name/description",
  async (
    req: Request<{ name: string }, {}, { token: string; description: string }>,
    res: Response
  ) => {
    const { name } = req.params
    const { description } = req.body

    const user = res.locals.user

    const group = await prisma.group.findFirst({
      where: { name, admins: { some: { id: user.id } } },
    })
    if (!group) return throwUnauthorized(res, "Not Authorized!")

    const updatedGroupInfo = await prisma.group.update({
      where: { id: group.id },
      data: {
        description,
      },
    })

    return res.json(updatedGroupInfo)
  }
)

/**
 * Join a Group
 * @name /group/:name/join
 * @function
 * @memberof module:routes/group~groupRouter
 */
router.post(
  "/:name/join",
  async (
    req: Request<{ name: string }, {}, { token: string }>,
    res: Response
  ) => {
    const { name } = req.params

    const user = res.locals.user

    const groupJoined = await prisma.group.update({
      where: { name },
      data: {
        users: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    return res.json({ joined: groupJoined })
  }
)

export default router
