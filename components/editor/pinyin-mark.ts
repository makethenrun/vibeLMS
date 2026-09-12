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
 * Inline mark that renders selected text as a native ruby annotation: the base
 * text stays on the line and the stored `pinyin` is shown above it via a real
 * `<rt>` element. Native ruby positions the annotation above the base and grows
 * the line box to fit it (so the previous line isn't overlapped) with no custom
 * CSS, which also means students see it in the read-only view.
 *
 * The base text is wrapped in `<span class="pinyin-base">` (the ProseMirror
 * content hole must be the only child of its parent), and `<rt>` is ignored on
 * parse so copy/paste doesn't duplicate the annotation text into the document.
 */
export const Pinyin = Mark.create({
  name: "pinyin",
  inclusive: false,

  addAttributes() {
    return {
      pinyin: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("rt")?.textContent?.trim() ??
          element.getAttribute("data-pinyin") ??
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
    return [{ tag: "rt", ignore: true }, { tag: "ruby" }];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const pinyin = (mark.attrs.pinyin as string) ?? "";
    return [
      "ruby",
      mergeAttributes(HTMLAttributes, { class: "pinyin-ruby" }),
      ["span", { class: "pinyin-base" }, 0],
      ["rt", { class: "pinyin-rt", contenteditable: "false" }, pinyin],
    ];
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
