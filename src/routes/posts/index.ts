import express from "express"

import verifyUser from "../../middleware/auth"
import getPosts from "./posts"
import { delPostWithId, getPostWithId, putPostWithId } from "./[id]"
import { getPostsWithUsername } from "./[username]"
import { getPostsWithGroupName, postPostToAGroup } from "./[groupname]"
import { postADownvoteWithId, postAnUpvoteWithId } from "./[id]vote"

const router = express.Router()

router.get("/", getPosts)
router.get("/:postId", getPostWithId)
router.get("/user/:username", getPostsWithUsername)
router.get("/group/:groupname", getPostsWithGroupName)

/**
 * Auth Middleware for
 * verifying User JWT token
 * Assigns to res.locals.user
 */
router.use(verifyUser)
router.post("/:groupname", postPostToAGroup)
router.put("/:id", putPostWithId)
router.delete("/:id", delPostWithId)
router.post("/:postId/vote/up", postAnUpvoteWithId)
router.post("/:postId/vote/down", postADownvoteWithId)

export default router
