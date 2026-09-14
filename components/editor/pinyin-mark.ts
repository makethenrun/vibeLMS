import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pinyin: {
      /** Annotate the current selection with text shown above it. */
      setPinyin: (pinyin: string) => ReturnType;
      /** Remove only the annotation above the current selection. */
      unsetPinyin: () => ReturnType;
    };
  }
}

/**
 * Inline mark that shows the stored `pinyin` above the selected text. It renders
 * as a plain `<span class="pinyin-ruby" data-pinyin="…">base</span>`: the base is
 * ordinary span content (so it can never collapse the way a native <ruby> base
 * can), and the annotation is painted above it purely in CSS via a `::before`
 * pseudo-element (see globals.css). Because the annotation lives in an attribute,
 * not in rendered HTML, changing this renderer also fixes annotations saved by
 * earlier versions.
 */
export const Pinyin = Mark.create({
  name: "pinyin",
  inclusive: false,

  addAttributes() {
    return {
      pinyin: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-pinyin") ??
          element.querySelector("rt")?.textContent?.trim() ??
          "",
        renderHTML: (attributes) => {
          const pinyin = (attributes.pinyin as string) ?? "";
          if (!pinyin) return {};
          return { "data-pinyin": pinyin };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "rt", ignore: true }, { tag: "span.pinyin-ruby" }, { tag: "ruby" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "pinyin-ruby" }), 0];
  },

  addCommands() {
    return {
      setPinyin:
        (pinyin: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { pinyin }).run(),
      unsetPinyin:
        () =>
        ({ chain }) =>
          chain().unsetMark(this.name).run(),
    };
  },
});
