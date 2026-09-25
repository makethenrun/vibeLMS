import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlightColor: {
      /** Set the inline background (highlight) colour on the selection. */
      setHighlightColor: (color: string) => ReturnType;
      /** Remove the inline background colour from the selection. */
      unsetHighlightColor: () => ReturnType;
    };
  }
}

/**
 * Adds a `bgColor` attribute to the TextStyle mark so selected text in the
 * rich-text (INFO) editor can be highlighted with any colour — the editor
 * equivalent of a note's background colour. Stored as an inline style so the
 * read-only student view renders it with the same TextStyle extension.
 */
export const HighlightColor = Extension.create({
  name: "highlightColor",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          bgColor: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
            renderHTML: (attributes: { bgColor?: string | null }) =>
              attributes.bgColor
                ? { style: `background-color: ${attributes.bgColor}; border-radius: 0.15em` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setHighlightColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { bgColor: color }).run(),
      unsetHighlightColor:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { bgColor: null }).removeEmptyTextStyle().run(),
    };
  },
});
