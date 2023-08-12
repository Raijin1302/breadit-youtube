import CommentsSection from "@/components/CommentsSection"
import EditorOutput from "@/components/EditorOutput"
import PostVoteServer from "@/components/post-vote/PostVoteServer"
import { buttonVariants } from "@/components/ui/Button"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"
import { formatTimeToNow } from "@/lib/utils"
import { CachedPost } from "@/types/redis"
import { Post, User, Vote } from "@prisma/client"
import { ArrowBigDown, ArrowBigUp, Loader2 } from "lucide-react"
import { notFound } from "next/navigation"
import { Suspense } from "react"

interface pageProps {
  params: {
    postId: string
  }
}

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

const page = async ({ params }: pageProps) => {
  const cachedPost = (await redis.hgetall(
    `post:${params.postId}`
  )) as CachedPost

  let post: (Post & { votes: Vote[]; author: User }) | null = null

  if (!cachedPost) {
    post = await db.post.findFirst({
      where: {
        id: params.postId,
      },
      include: {
        votes: true,
        author: true,
      },
    })
  }
  if (!post && !cachedPost) return notFound()
  return (
    <div className="h-full flex flex-col sm:flex-row items-center sm:items-start justify-between">
      <Suspense fallback={<PostVoteShell />}>
        {/* @ts-expect-error s */}
        <PostVoteServer
          postId={post?.id ?? cachedPost.id}
          getData={async () => {
            return await db.post.findUnique({
              where: {
                id: params.postId,
              },
              include: {
                votes: true,
              },
            })
          }}
        />
      </Suspense>
      <div className="sm:w-0 w-full flex-1 bg-card text-card-foreground shadow-sm p-4 rounded-sm">
        <p className="max-h-40 mt-1 truncate text-xs text-gray-500">
          Post by u/{post?.author.username ?? cachedPost.authorUsername}
          {""}{" "}
          {formatTimeToNow(new Date(post?.createdAt ?? cachedPost.createdAt))}
        </p>
        <h1 className="text-xl font-semibold py-2 leading-6 text-gray-900 dark:text-zinc-300">
          {post?.title ?? cachedPost.title}
        </h1>
        <EditorOutput content={post?.content ?? cachedPost.content} />
        <Suspense
          fallback={<Loader2 className="h-5 w-5 animate-spin text-zinc-700" />}
        >
          {/* @ts-expect-error  */}
          <CommentsSection postId={post?.id ?? cachedPost.id} />
        </Suspense>
      </div>
    </div>
  )
}

function PostVoteShell() {
  return (
    <div className="flex items-center flex-col pr-6 w-20">
      {/* Upvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigUp className="w-5 h-5 text-zinc-700" />
      </div>
      {/* Score */}
      <div className="text-center py-2 font-medium text-sm text-zinc-700">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>

      {/* Downvote */}
      <div className={buttonVariants({ variant: "ghost" })}>
        <ArrowBigDown className="w-5 h-5 text-zinc-700" />
      </div>
    </div>
  )
}

export default page
