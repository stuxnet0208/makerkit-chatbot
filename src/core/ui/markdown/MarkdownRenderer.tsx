import { memo } from 'react';
import Markdown from 'markdown-to-jsx';
import classNames from 'clsx';

import MarkdownStyles from './MarkdownRenderer.module.css';

const MemoizedReactMarkdown = memo(
  Markdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);

export default function MarkdownRenderer(
  props: React.PropsWithChildren<{ className?: string; children: string }>,
) {
  return (
    <MemoizedReactMarkdown
      className={classNames(props.className, MarkdownStyles.MarkdownRenderer, `MarkdownRenderer`)}
    >
      {props.children}
    </MemoizedReactMarkdown>
  );
}
