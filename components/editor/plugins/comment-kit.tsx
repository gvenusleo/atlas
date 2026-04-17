"use client"

import type { ExtendConfig, Path } from "platejs"

import { type BaseCommentConfig, BaseCommentPlugin } from "@platejs/comment"
import { toTPlatePlugin } from "platejs/react"

export type CommentConfig = ExtendConfig<
  BaseCommentConfig,
  {
    activeId: string | null
    commentingBlock: number[] | null
    hoverId: string | null
    uniquePathMap: Map<string, Path>
  }
>

export const commentPlugin = toTPlatePlugin<CommentConfig>(BaseCommentPlugin, {
  options: {
    activeId: null,
    commentingBlock: null,
    hoverId: null,
    uniquePathMap: new Map(),
  },
})

export const CommentKit = [commentPlugin]
