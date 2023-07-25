import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"
import { CommentVoteValidator } from "@/lib/validators/vote"
import { CachedPost } from "@/types/redis"
import { z } from "zod"

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const { commentId, voteType } = CommentVoteValidator.parse(body)
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const existingVote = await db.commentVote.findFirst({
      where: {
        userId: session.user.id,
        commentId,
      },
    })

    if (existingVote) {
      if (existingVote.type === voteType) {
        await db.commentVote.delete({
          where: {
            id: existingVote.id,
          },
        })
        return new Response("OK")
      } else {
        // if vote type is different, update the vote
        await db.commentVote.update({
          where: {
            id: session.user.id,
          },
          data: {
            type: voteType,
          },
        })
      }

      return new Response("OK")
    }

    // if no existing vote, create a new vote
    await db.commentVote.create({
      data: {
        type: voteType,
        userId: session.user.id,
        commentId,
      },
    })

    return new Response("OK")
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }

    return new Response(
      "Could not post to subreddit at this time. Please try later",
      { status: 500 }
    )
  }
}