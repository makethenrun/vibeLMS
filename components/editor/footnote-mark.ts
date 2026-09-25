import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      /** Attach a footnote note to the current selection. */
      setFootnote: (note: string) => ReturnType;
      /** Remove the footnote from the current selection. */
      unsetFootnote: () => ReturnType;
    };
  }
}

/**
 * Inline mark that attaches a hidden note ("footnote") to a word or phrase. The
 * note text lives in a `data-note` attribute; the renderer shows a small marker
 * at the top-right of the text and a pop-up (styled in globals.css) that appears
 * when the student hovers the word. Attribute-based like the pinyin mark, so the
 * marker and pop-up are regenerated from the stored note on every render.
 */
export const Footnote = Mark.create({
  name: "footnote",
  inclusive: false,

  addAttributes() {
    return {
      note: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-note") ?? "",
        renderHTML: (attributes) => {
          const note = (attributes.note as string) ?? "";
          if (!note) return {};
          return { "data-note": note };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: "span.footnote-rt", ignore: true },
      { tag: "span.footnote-ref" },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const note = (mark.attrs.note as string) ?? "";
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "footnote-ref", title: note }),
      ["span", { class: "footnote-base" }, 0],
      ["span", { class: "footnote-marker", contenteditable: "false" }, "*"],
      ["span", { class: "footnote-rt", contenteditable: "false" }, note],
    ];
  },

  addCommands() {
    return {
      setFootnote:
        (note: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { note }).run(),
      unsetFootnote:
        () =>
        ({ chain }) =>
          chain().unsetMark(this.name).run(),
    };
  },
});
