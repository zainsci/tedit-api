import express, { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import bycrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cors from "cors"

import { throwNotFound, throwNotAcceptable, throwUnauthorized } from "./utils"

const PORT = 3001
const JWT_SECRET = process.env.JWT_SECRET || "SECRET"
var CORS_OPTS = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
}

const prisma = new PrismaClient()
const app = express()
app.use(express.json())
app.use(cors(CORS_OPTS))

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Server Is UP! 😄",
  })
})

/**
 * Auth Routes
 * POST /register
 * POST /login
 * PUT /change-password
 */
app.post(
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

app.post(
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
app.put(
  "/change-password",
  async (
    req: Request<
      {},
      {},
      { token: string; password: string; newPassword: string }
    >,
    res: Response
  ) => {
    const { token, password, newPassword } = req.body

    if (newPassword.length < 8)
      return throwNotAcceptable(res, "Password must be of length 8 or above")
    if (password === newPassword)
      return throwNotAcceptable(res, "New password is the same as old one")

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }
      const user = await prisma.user.findFirst({ where: { username } })

      if (!user) return throwNotFound(res, "User doesn't exist.")

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
    } catch (e) {
      return throwUnauthorized(res, "Invalid Token!")
    }
  }
)

/**
 * Posts Routes
 * GET /posts
 * POST /posts
 * PUT /posts
 * DELETE /posts
 */
// Gel all of the Posts of a Group
app.get("/posts/:groupname", async (req: Request, res: Response) => {
  const { groupname } = req.params

  const posts = await prisma.post.findMany({
    where: {
      group: { name: groupname },
    },
  })

  if (posts.length == 0)
    return throwNotFound(res, `Group with name ${groupname} doesn't exist!`)

  res.json(posts)
})

// Create a new Post
app.post(
  "/posts/:groupname",
  async (
    req: Request<
      { groupname: string },
      {},
      { title: string; body: string; token: string }
    >,
    res: Response
  ) => {
    const { groupname } = req.params
    const { title, body, token } = req.body

    if (title.length <= 0)
      return throwNotAcceptable(res, "Title must be of lenght bigger than 0!")

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }

      if (!username) return throwUnauthorized(res, "Invalid Token!")

      const thisUser = await prisma.user.findFirst({ where: { username } })
      const thisGroup = await prisma.group.findFirst({
        where: { name: groupname },
      })

      if (!thisGroup || !thisUser)
        return throwNotFound(
          res,
          !thisGroup
            ? `Group with name ${groupname} doesn't exist`
            : `User with name ${username} doesn't exist!`
        )

      try {
        const newPost = await prisma.post.create({
          data: {
            title,
            body,
            authorId: thisUser.id,
            groupId: thisGroup.id,
          },
        })

        return res.json(newPost)
      } catch (e) {
        return res.status(500).json({
          message: "New post creation failed!",
        })
      }
    } catch (e) {
      return throwUnauthorized(res, "Invalid Token!")
    }
  }
)

// Update a Post
app.put(
  "/posts/:id",
  async (
    req: Request<
      { id: string },
      {},
      { token: string; title: string; body: string }
    >,
    res: Response
  ) => {
    const { id } = req.params
    const { token, title, body } = req.body

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }
      const user = await prisma.user.findFirst({ where: { username } })

      if (!user)
        return throwNotFound(
          res,
          `User with username ${username} doesn't exist!`
        )

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
    } catch (e) {
      return throwUnauthorized(res, "Invalid Token!")
    }
  }
)

// Delete a Post
app.delete(
  "/posts",
  async (
    req: Request<{ postId: string }, {}, { token: string }>,
    res: Response
  ) => {
    const { postId } = req.params
    const { token } = req.body

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }
      const user = await prisma.user.findFirst({ where: { username } })

      if (!user)
        return throwNotFound(
          res,
          `User with username ${username} doesn't exist!`
        )

      parseInt
      const post = await prisma.post.findFirst({
        where: { id: parseInt(postId, 10) },
      })
      if (!post)
        return throwNotFound(res, `Post with ID ${postId} doesn't exist!`)

      if (post.authorId !== user.id)
        return throwUnauthorized(res, "Not Authorized!")

      const delPost = await prisma.post.delete({ where: post })
      return res.json(delPost)
    } catch (e) {
      return throwUnauthorized(res, "Invalid Token!")
    }
  }
)

/**
 * Groups
 * POST /group/create
 * PUT /group/:name/description
 */
app.post(
  "/group/create",
  async (
    req: Request<{}, {}, { token: string; name: string; description: string }>,
    res: Response
  ) => {
    const { token, name, description } = req.body

    if (name.length <= 3) {
      throwNotAcceptable(res, "Group name should be of length 4 or above!")
    }

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }
      if (!username) return throwUnauthorized(res, "Invalid Token!")

      const user = await prisma.user.findFirst({ where: { username } })
      if (!user) return throwNotFound(res, "Username doesn't exist!")

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
    } catch (e) {
      return throwUnauthorized(res, "Invalid Token!")
    }
  }
)

// Update a Group Meta
app.put(
  "/group/:name/description",
  async (
    req: Request<{ name: string }, {}, { token: string; description: string }>,
    res: Response
  ) => {
    const { name } = req.params
    const { token, description } = req.body

    try {
      const { username } = jwt.verify(token, JWT_SECRET) as { username: string }

      const user = await prisma.user.findFirst({ where: { username } })
      if (!user) return throwNotFound(res, "Username doesn't exist!")

      const group = await prisma.group.findFirst({ where: { name } })
      if (!group) return throwNotFound(res, "Group doesn't exist!")

      const updatedGroupInfo = await prisma.group.update({
        where: { id: group.id },
        data: {
          description,
        },
      })

      return res.json(updatedGroupInfo)
    } catch (e) {
      throwUnauthorized(res, "Invalid Token!")
    }
  }
)

app.listen(PORT, () => {
  console.log(`[INFO]: Listening on PORT:${PORT}!!!`)
})
