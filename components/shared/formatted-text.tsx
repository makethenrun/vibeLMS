import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * Renders lightweight inline formatting tags embedded in a plain string, so
 * formatting can be stored inside existing text fields without changing the
 * data model or breaking answer checking (which only ever reads the raw text).
 *
 * Supported tags (BBCode-style, may nest):
 *   [b]…[/b]  bold      [i]…[/i]  italic
 *   [u]…[/u]  underline [c=#rrggbb]…[/c]  colour
 */
const TAG_RE = /\[(\/?)(b|i|u)\]|\[c=(#[0-9a-fA-F]{3,8})\]|(\[\/c\])/g;

interface Entry {
  tag: "b" | "i" | "u" | "c";
  color?: string;
}

function styleFromStack(stack: Entry[]): CSSProperties {
  const style: CSSProperties = {};
  const decorations: string[] = [];
  for (const e of stack) {
    if (e.tag === "b") style.fontWeight = 700;
    else if (e.tag === "i") style.fontStyle = "italic";
    else if (e.tag === "u") decorations.push("underline");
    else if (e.tag === "c") style.color = e.color;
  }
  if (decorations.length) style.textDecoration = decorations.join(" ");
  return style;
}

function popTag(stack: Entry[], tag: Entry["tag"]): void {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].tag === tag) {
      stack.splice(i, 1);
      return;
    }
  }
}

export function FormattedText({ text }: { text: string | null | undefined }): ReactNode {
  if (!text) return text ?? null;
  if (!text.includes("[")) return text;

  const nodes: ReactNode[] = [];
  const stack: Entry[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  const emit = (chunk: string) => {
    if (!chunk) return;
    const style = styleFromStack(stack);
    nodes.push(
      Object.keys(style).length ? (
        <span key={key++} style={style}>{chunk}</span>
      ) : (
        <Fragment key={key++}>{chunk}</Fragment>
      ),
    );
  };

  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text)) !== null) {
    emit(text.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[3]) stack.push({ tag: "c", color: m[3] });
    else if (m[4]) popTag(stack, "c");
    else {
      const tag = m[2] as "b" | "i" | "u";
      if (m[1] === "/") popTag(stack, tag);
      else stack.push({ tag });
    }
  }
  emit(text.slice(last));

  return <>{nodes}</>;
}
