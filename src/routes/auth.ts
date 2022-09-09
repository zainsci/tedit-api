import express, { Request, Response } from "express"
import bycrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import prisma from "../prisma/client"
import { throwNotAcceptable, throwNotFound, throwUnauthorized } from "../utils"
import verifyUser from "../middleware/auth"

const JWT_SECRET = process.env.JWT_SECRET || "SECRET"
const router = express.Router()

/**
 * Auth Routes
 * POST /register
 * POST /login
 * PUT /change-password
 */
router.post(
  "/register",
  async (
    req: Request<{}, {}, { username: string; email: string; password: string }>,
    res: Response
  ) => {
    const { username, email, password } = req.body

    if (!username || username.length < 4)
      return throwNotAcceptable(res, "Username must be of length 8 or above")
    if (!email) return throwNotAcceptable(res, "Invalid Email!")
    if (!password || password.length < 8)
      return throwNotAcceptable(res, "Password must be of length 8 or above")

    const hash = bycrypt.hashSync(password)
    const newUser = await prisma.user
      .create({
        data: {
          username,
          email,
          hash,
        },
      })
      .catch((e) => {
        throwNotAcceptable(res, `${e?.meta?.target[0]} already exists`)
      })

    if (newUser) {
      const { hash: _, ...returnUser } = newUser
      return res.json(returnUser)
    }

    return res.status(500).json({ message: "User creation failed!" })
  }
)

router.post(
  "/login",
  async (
    req: Request<{}, {}, { username: string; password: string }>,
    res: Response
  ) => {
    const { username, password } = req.body

    if (!username) return throwNotAcceptable(res, "Invalid Username!")
    if (!password) return throwNotAcceptable(res, "Invalid Password!")

    const user = await prisma.user.findFirst({
      where: {
        username,
      },
    })

    if (!user)
      return throwNotFound(res, `User with username ${username} doesn't exits!`)

    if (!bycrypt.compareSync(password, user.hash))
      return throwNotAcceptable(res, "Wrong Password!")

    const jwtToken = jwt.sign({ username }, JWT_SECRET)
    res.cookie("token", jwtToken)
    return res.json({
      token: jwtToken,
    })
  }
)

// Change a User's password
router.put(
  "/change-password",
  verifyUser,
  async (
    req: Request<
      {},
      {},
      { token: string; password: string; newPassword: string }
    >,
    res: Response
  ) => {
    const { password, newPassword } = req.body

    if (newPassword.length < 8)
      return throwNotAcceptable(res, "Password must be of length 8 or above")
    if (password === newPassword)
      return throwNotAcceptable(res, "New password is the same as old one")

    const user = res.locals.user

    if (!bycrypt.compareSync(password, user.hash))
      return throwNotAcceptable(res, "Wrong Password!")

    const newHash = bycrypt.hashSync(newPassword)

    const { hash: _, ...updatedUser } = await prisma.user.update({
      where: { id: user.id },
      data: {
        hash: newHash,
      },
    })

    if (!updatedUser)
      return res.status(500).json({ message: "Something Went Wrong!" })

    return res.json(updatedUser)
  }
)

export default router
