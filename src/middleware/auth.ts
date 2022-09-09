import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

import prisma from "../prisma/client"
import { throwNotFound, throwUnauthorized } from "../utils"

const JWT_SECRET = process.env.JWT_SECRET as string

export default async function verifyUser(
  req: Request<{}, {}, { token: string }>,
  res: Response,
  next: NextFunction
) {
  const { token } = req.body

  try {
    const { username } = jwt.verify(token, JWT_SECRET) as { username: string }
    if (!username) return throwUnauthorized(res, "Invalid Token!")

    const user = await prisma.user.findFirst({ where: { username } })
    if (!user) return throwNotFound(res, "User doesn't exist.")

    res.locals.user = user

    next()
  } catch (e) {
    return throwUnauthorized(res, "Invalid Token!")
  }
}
