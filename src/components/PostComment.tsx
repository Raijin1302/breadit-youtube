"use client"
import { FC, useRef } from "react"
import UserAvatar from "./UserAvatar"
import { formatTimeToNow } from "@/lib/utils"
import { Comment, CommentVote, User } from "@prisma/client"

type ExtendedComment = Comment & {
  votes: CommentVote[]
  author: User
}

interface PostCommentProps {
  comment: ExtendedComment
}

const PostComment: FC<PostCommentProps> = ({ comment }) => {
  const commentRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={commentRef} className="flex flex-col">
      <div className="flex items-center">
        <UserAvatar
          user={{
            name: comment.author.name || null,
            image: comment.author.image || null,
          }}
          className="h-6 w-6"
        />
        <div className="ml-2 flex items-center gap-x-2">
          <p className="text-sm font-medium text-gray-900">
            u/{comment.author.username}
          </p>
          <p className="max-h-40 truncate text-zinc-500 text-xs">
            {formatTimeToNow(new Date(comment.createdAt))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PostComment