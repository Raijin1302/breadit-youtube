"use client"
import { ExtendedPost } from "@/types/db"
import { FC, useRef } from "react"
import { useIntersection } from "@mantine/hooks"
import { useInfiniteQuery } from "@tanstack/react-query"
import { INFINITE_SCROLLING_PAGINATION_RESULTS } from "@/config"
import axios from "axios"
import { getAuthSession } from "@/lib/auth"
import { useSession } from "next-auth/react"
interface PostFeedProps {
  initialPost: ExtendedPost[]
  subredditName?: string
}

const PostFeed: FC<PostFeedProps> = ({ initialPost, subredditName }) => {
  const lastPostRef = useRef<HTMLElement>(null)
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  })
  //For client side using useSession()
  const { data: session } = useSession()
  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
    ["infinite-query"],
    async ({ pageParam = 1 }) => {
      const query =
        `/api/post?limit=${INFINITE_SCROLLING_PAGINATION_RESULTS}&page=${pageParam}` +
        (!!subredditName ? `&subredditName=${subredditName}` : "")

      const { data } = await axios.get(query)

      return data as ExtendedPost[]
    },
    {
      getNextPageParam: (_, pages) => {
        return pages.length + 1
      },
      initialData: { pages: [initialPost], pageParams: [1] },
    }
  )

  const posts = data?.pages.flatMap((page) => page) ?? initialPost
  return (
    <ul className="flex flex-col col-span-2 space-y-6">
      {posts.map((post, index) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === "UP") return acc + 1
          if (vote.type === "DOWN") return acc - 1

          return acc
        }, 0)

        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id
        )
        return <div>Post</div>
      })}
    </ul>
  )
}

export default PostFeed