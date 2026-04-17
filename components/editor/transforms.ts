"use client"

import type { PlateEditor } from "platejs/react"

import { insertCodeBlock, toggleCodeBlock } from "@platejs/code-block"
import { upsertLink } from "@platejs/link"
import { insertEquation, insertInlineEquation } from "@platejs/math"
import { insertMediaEmbed } from "@platejs/media"
import { TablePlugin } from "@platejs/table/react"
import {
  type NodeEntry,
  type Path,
  type TElement,
  isUrl,
  KEYS,
  PathApi,
} from "platejs"

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true }
  )
}

const insertBlockMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.mediaEmbed]: (editor) => {
    const value = globalThis.window?.prompt("输入要嵌入的外链地址")
    const url = value?.trim()

    if (!url || !isUrl(url)) {
      return
    }

    insertMediaEmbed(editor, { url }, { select: true })
  },
  [KEYS.table]: (editor) =>
    editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
}

const insertInlineMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.inlineEquation]: (editor) =>
    insertInlineEquation(editor, "", { select: true }),
  [KEYS.link]: (editor) => {
    const value = globalThis.window?.prompt("输入链接地址")
    const url = value?.trim()

    if (!url || !isUrl(url)) {
      return
    }

    upsertLink(editor, {
      text: editor.api.isCollapsed() ? url : undefined,
      url,
    })
  },
}

type InsertBlockOptions = {
  upsert?: boolean
}

export const insertBlock = (
  editor: PlateEditor,
  type: string,
  options: InsertBlockOptions = {}
) => {
  const { upsert = false } = options

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block()

    if (!block) return

    const [currentNode, path] = block
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode)
    const currentBlockType = getBlockType(currentNode)

    const isSameBlockType = type === currentBlockType

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return
    }

    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type)
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      })
    }

    if (!isSameBlockType) {
      editor.tf.removeNodes({ previousEmptyBlock: true })
    }
  })
}

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type)
  }
}

const setList = (
  editor: PlateEditor,
  type: string,
  entry: NodeEntry<TElement>
) => {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    }
  )
}

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [KEYS.codeBlock]: (editor) => toggleCodeBlock(editor),
}

export const setBlockType = (
  editor: PlateEditor,
  type: string,
  { at }: { at?: Path } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, "indent"], { at: path })
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry)
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path })
      }
    }

    if (at) {
      const entry = editor.api.node<TElement>(at)

      if (entry) {
        setEntry(entry)

        return
      }
    }

    const entries = editor.api.blocks({ mode: "lowest" })

    entries.forEach((entry) => {
      setEntry(entry)
    })
  })
}

export const getBlockType = (block: TElement) => {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol
    }
    if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo
    }
    return KEYS.ul
  }

  return block.type
}
