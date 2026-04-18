import { CaptionPlugin } from "@platejs/caption/react"
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@platejs/code-block/react"
import { IndentPlugin } from "@platejs/indent/react"
import { LinkPlugin } from "@platejs/link/react"
import { ListPlugin } from "@platejs/list/react"
import { MarkdownPlugin, remarkMdx } from "@platejs/markdown"
import { EquationPlugin, InlineEquationPlugin } from "@platejs/math/react"
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
} from "@platejs/media/react"
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react"
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  KbdPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react"
import { all, createLowlight } from "lowlight"
import { ExitBreakPlugin, KEYS, TrailingBlockPlugin } from "platejs"
import { ParagraphPlugin } from "platejs/react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { AutoformatKit } from "@/components/editor/plugins/autoformat-kit"
import { BlockList } from "@/components/ui/block-list"
import { BlockquoteElement } from "@/components/ui/blockquote-node"
import {
  CodeBlockElement,
  CodeLineElement,
  CodeSyntaxLeaf,
} from "@/components/ui/code-block-node"
import { CodeLeaf } from "@/components/ui/code-node"
import {
  EquationElement,
  InlineEquationElement,
} from "@/components/ui/equation-node"
import {
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element,
} from "@/components/ui/heading-node"
import { HighlightLeaf } from "@/components/ui/highlight-node"
import { HrElement } from "@/components/ui/hr-node"
import { KbdLeaf } from "@/components/ui/kbd-node"
import { LinkElement } from "@/components/ui/link-node"
import { AudioElement } from "@/components/ui/media-audio-node"
import { FileElement } from "@/components/ui/media-file-node"
import { ImageElement } from "@/components/ui/media-image-node"
import { VideoElement } from "@/components/ui/media-video-node"
import { ParagraphElement } from "@/components/ui/paragraph-node"
import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from "@/components/ui/table-node"

const lowlight = createLowlight(all)

export const atlasEditorKit = [
  ParagraphPlugin.configure({
    node: { component: ParagraphElement },
  }),
  H1Plugin.configure({
    node: { component: H1Element },
  }),
  H2Plugin.configure({
    node: { component: H2Element },
  }),
  H3Plugin.configure({
    node: { component: H3Element },
  }),
  H4Plugin.configure({
    node: { component: H4Element },
  }),
  H5Plugin.configure({
    node: { component: H5Element },
  }),
  H6Plugin.configure({
    node: { component: H6Element },
  }),
  BlockquotePlugin.configure({
    node: { component: BlockquoteElement },
  }),
  HorizontalRulePlugin.configure({
    node: { component: HrElement },
  }),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin.configure({
    shortcuts: { toggle: { keys: "mod+shift+x" } },
  }),
  CodePlugin.configure({
    node: { component: CodeLeaf },
    shortcuts: { toggle: { keys: "mod+e" } },
  }),
  HighlightPlugin.configure({
    node: { component: HighlightLeaf },
    shortcuts: { toggle: { keys: "mod+shift+h" } },
  }),
  KbdPlugin.withComponent(KbdLeaf),
  SubscriptPlugin.configure({
    shortcuts: { toggle: { keys: "mod+comma" } },
  }),
  SuperscriptPlugin.configure({
    shortcuts: { toggle: { keys: "mod+period" } },
  }),
  CodeBlockPlugin.configure({
    node: { component: CodeBlockElement },
    options: { lowlight },
    rules: {
      break: {
        empty: "reset",
        emptyLineEnd: "deleteExit",
      },
    },
  }),
  CodeLinePlugin.configure({
    node: { component: CodeLineElement },
  }),
  CodeSyntaxPlugin.configure({
    node: { component: CodeSyntaxLeaf },
  }),
  IndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock],
    },
    options: {
      offset: 24,
    },
  }),
  ListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
  LinkPlugin.configure({
    node: { component: LinkElement },
  }),
  TablePlugin.configure({
    node: { component: TableElement },
  }),
  TableRowPlugin.configure({
    node: { component: TableRowElement },
  }),
  TableCellPlugin.configure({
    node: { component: TableCellElement },
  }),
  TableCellHeaderPlugin.configure({
    node: { component: TableCellHeaderElement },
  }),
  ImagePlugin.configure({
    node: { component: ImageElement },
  }),
  VideoPlugin.configure({
    node: { component: VideoElement },
  }),
  AudioPlugin.configure({
    node: { component: AudioElement },
  }),
  FilePlugin.configure({
    node: { component: FileElement },
  }),
  MediaEmbedPlugin.configure({
    node: { component: VideoElement as never },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  InlineEquationPlugin.configure({
    node: { component: InlineEquationElement },
  }),
  EquationPlugin.configure({
    node: { component: EquationElement },
  }),
  ...AutoformatKit,
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx],
    },
  }),
  ExitBreakPlugin.configure({
    shortcuts: {
      insert: { keys: "mod+enter" },
      insertBefore: { keys: "mod+shift+enter" },
    },
  }),
  TrailingBlockPlugin.configure({
    options: {
      type: KEYS.p,
    },
  }),
]
