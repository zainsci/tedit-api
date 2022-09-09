import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotAcceptable, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const router = express.Router()

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

export default router
