import express, { Request, Response } from "express"

import prisma from "../prisma/client"
import { throwNotFound } from "../utils"

const router = express.Router()

/**
 * Get User metadata and
 * @name /user/:username
 * @function
 * @memberof module:routes/user~userRouter
 */
router.get(
  "/:username",
  async (req: Request<{ username: string }>, res: Response) => {
    const { username } = req.params

    const user = await prisma.user.findFirst({
      where: {
        username,
      },
    })
    if (!user) return throwNotFound(res, "User doesn't exist")

    return res.json(user)
  }
)

export default router
