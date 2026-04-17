'use client';

import type { AutoformatRule } from '@platejs/autoformat';

import {
  autoformatArrow,
  autoformatLegal,
  autoformatLegalHtml,
  autoformatMath,
  AutoformatPlugin,
  autoformatPunctuation,
  autoformatSmartQuotes,
} from '@platejs/autoformat';
import { insertEmptyCodeBlock } from '@platejs/code-block';
import { toggleList } from '@platejs/list';
import { insertEquation, insertInlineEquation } from '@platejs/math';
import { KEYS, createTSlatePlugin } from 'platejs';

const autoformatMarks: AutoformatRule[] = [
  {
    match: '***',
    mode: 'mark',
    type: [KEYS.bold, KEYS.italic],
  },
  {
    match: '__*',
    mode: 'mark',
    type: [KEYS.underline, KEYS.italic],
  },
  {
    match: '__**',
    mode: 'mark',
    type: [KEYS.underline, KEYS.bold],
  },
  {
    match: '___***',
    mode: 'mark',
    type: [KEYS.underline, KEYS.bold, KEYS.italic],
  },
  {
    match: '**',
    mode: 'mark',
    type: KEYS.bold,
  },
  {
    match: '__',
    mode: 'mark',
    type: KEYS.underline,
  },
  {
    match: '*',
    mode: 'mark',
    type: KEYS.italic,
  },
  {
    match: '_',
    mode: 'mark',
    type: KEYS.italic,
  },
  {
    match: '~~',
    mode: 'mark',
    type: KEYS.strikethrough,
  },
  {
    match: '^',
    mode: 'mark',
    type: KEYS.sup,
  },
  {
    match: '~',
    mode: 'mark',
    type: KEYS.sub,
  },
  {
    match: '==',
    mode: 'mark',
    type: KEYS.highlight,
  },
  {
    match: '≡',
    mode: 'mark',
    type: KEYS.highlight,
  },
  {
    match: '`',
    mode: 'mark',
    type: KEYS.code,
  },
];

const autoformatBlocks: AutoformatRule[] = [
  {
    match: '# ',
    mode: 'block',
    type: KEYS.h1,
  },
  {
    match: '## ',
    mode: 'block',
    type: KEYS.h2,
  },
  {
    match: '### ',
    mode: 'block',
    type: KEYS.h3,
  },
  {
    match: '#### ',
    mode: 'block',
    type: KEYS.h4,
  },
  {
    match: '##### ',
    mode: 'block',
    type: KEYS.h5,
  },
  {
    match: '###### ',
    mode: 'block',
    type: KEYS.h6,
  },
  {
    match: '> ',
    mode: 'block',
    type: KEYS.blockquote,
  },
  {
    match: '```',
    mode: 'block',
    type: KEYS.codeBlock,
    format: (editor) => {
      insertEmptyCodeBlock(editor, {
        defaultType: KEYS.p,
        insertNodesOptions: { select: true },
      });
    },
  },
  {
    match: '$$ ',
    mode: 'block',
    type: KEYS.equation,
    format: (editor) => {
      insertEquation(editor, { select: true });
    },
  },
  {
    match: ['---', '—-', '___ '],
    mode: 'block',
    type: KEYS.hr,
    format: (editor) => {
      editor.tf.setNodes({ type: KEYS.hr });
      editor.tf.insertNodes({
        children: [{ text: '' }],
        type: KEYS.p,
      });
    },
  },
];

const autoformatLists: AutoformatRule[] = [
  {
    match: ['* ', '- '],
    mode: 'block',
    type: 'list',
    format: (editor) => {
      toggleList(editor, {
        listStyleType: KEYS.ul,
      });
    },
  },
  {
    match: [String.raw`^\d+\.$ `, String.raw`^\d+\)$ `],
    matchByRegex: true,
    mode: 'block',
    type: 'list',
    format: (editor, { matchString }) => {
      toggleList(editor, {
        listRestartPolite: Number(matchString) || 1,
        listStyleType: KEYS.ol,
      });
    },
  },
  {
    match: ['[] '],
    mode: 'block',
    type: 'list',
    format: (editor) => {
      toggleList(editor, {
        listStyleType: KEYS.listTodo,
      });
      editor.tf.setNodes({
        checked: false,
        listStyleType: KEYS.listTodo,
      });
    },
  },
  {
    match: ['[x] '],
    mode: 'block',
    type: 'list',
    format: (editor) => {
      toggleList(editor, {
        listStyleType: KEYS.listTodo,
      });
      editor.tf.setNodes({
        checked: true,
        listStyleType: KEYS.listTodo,
      });
    },
  },
];

const excludeCodeBlock = (rule: AutoformatRule): AutoformatRule => ({
  ...rule,
  query: (editor, options) => {
    const isInCodeBlock = editor.api.some({
      match: { type: editor.getType(KEYS.codeBlock) },
    });

    if (isInCodeBlock) {
      return false;
    }

    return rule.query ? rule.query(editor, options) : true;
  },
});

export const EquationAutoformatPlugin = createTSlatePlugin({
  editOnly: true,
  key: 'equation-autoformat',
}).overrideEditor(({ editor, tf: { insertText } }) => ({
  transforms: {
    insertText(text, options) {
      if (
        text !== '$' ||
        !editor.selection ||
        !editor.api.isCollapsed() ||
        editor.api.some({
          match: { type: editor.getType(KEYS.codeBlock) },
        })
      ) {
        return insertText(text, options);
      }

      const previousPoint = editor.api.before(editor.selection, {
        distance: 1,
        unit: 'character',
      });

      if (previousPoint) {
        const previousCharacter = editor.api.string({
          anchor: previousPoint,
          focus: editor.selection.anchor,
        });

        if (previousCharacter === '$') {
          return insertText(text, options);
        }
      }

      const beforeStartMatchPoint = editor.api.before(editor.selection, {
        matchString: '$',
        skipInvalid: true,
      });
      const afterStartMatchPoint = editor.api.before(editor.selection, {
        afterMatch: true,
        matchString: '$',
        skipInvalid: true,
      });

      if (!beforeStartMatchPoint || !afterStartMatchPoint) {
        return insertText(text, options);
      }

      const texExpression = editor.api.string({
        anchor: afterStartMatchPoint,
        focus: editor.selection.anchor,
      });

      if (!texExpression.trim()) {
        return insertText(text, options);
      }

      editor.tf.delete({
        at: {
          anchor: beforeStartMatchPoint,
          focus: editor.selection.anchor,
        },
      });

      insertInlineEquation(editor, texExpression);
    },
  },
}));

export const AutoformatKit = [
  AutoformatPlugin.configure({
    options: {
      enableUndoOnDelete: true,
      rules: [
        ...autoformatBlocks,
        ...autoformatMarks,
        ...autoformatSmartQuotes,
        ...autoformatPunctuation,
        ...autoformatLegal,
        ...autoformatLegalHtml,
        ...autoformatArrow,
        ...autoformatMath,
        ...autoformatLists,
      ].map(excludeCodeBlock),
    },
  }),
  EquationAutoformatPlugin,
];
