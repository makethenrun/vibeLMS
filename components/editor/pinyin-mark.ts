import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pinyin: {
      /** Annotate the current selection with pinyin shown above it. */
      setPinyin: (pinyin: string) => ReturnType;
      /** Remove the pinyin annotation from the current selection. */
      unsetPinyin: () => ReturnType;
    };
  }
}

/**
 * Inline mark that renders selected text as a ruby annotation: the stored
 * `pinyin` is shown above the base text. We keep the annotation in a
 * `data-pinyin` attribute and paint it with a CSS `::before` pseudo-element
 * (see globals.css `.pinyin-ruby`) rather than an `<rt>` text node, so the
 * ProseMirror document stays a plain marked text run — clean to edit and to
 * round-trip through the stored Tiptap JSON.
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
          element.querySelector("rt")?.textContent ??
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
    return [{ tag: "ruby" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["ruby", mergeAttributes(HTMLAttributes, { class: "pinyin-ruby" }), 0];
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
