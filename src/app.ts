import express, { Request, Response } from "express"
import cors from "cors"

import authRouter from "./routes/auth"
import postRouter from "./routes/post"
import groupRouter from "./routes/group"
import commentRouter from "./routes/comment"

const PORT = 3001
var CORS_OPTS = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
}

const app = express()
app.use(express.json())
app.use(cors(CORS_OPTS))
app.use("/", authRouter)
app.use("/posts", postRouter)
app.use("/group", groupRouter)
app.use("/comments", commentRouter)

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Server Is UP! 😄",
  })
})

app.listen(PORT, () => {
  console.log(`[INFO]: Listening on PORT:${PORT}!!!`)
})
