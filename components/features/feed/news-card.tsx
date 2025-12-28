"use client"

import { Calendar, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Database } from "@/types/database.types"
import { formatDistanceToNow } from "date-fns"

type CityPost = Database['public']['Tables']['city_posts']['Row']

interface NewsCardProps {
  post: CityPost
}

export function NewsCard({ post }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 airbnb-card p-5 group"
    >
      {/* Image - Left Side (Square) */}
      <div className="relative flex-none w-24 h-24 rounded-airbnb overflow-hidden bg-airbnb-light-gray">
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 min-w-0">
        {/* Category Badge */}
        {post.category && (
          <span className="inline-block px-2.5 py-1 rounded-airbnb bg-airbnb-light-gray text-airbnb-dark text-xs font-semibold mb-2">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-airbnb-dark line-clamp-2 mb-2 group-hover:text-airbnb-red transition-colors text-base">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-airbnb-gray line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-airbnb-gray">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
