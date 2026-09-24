import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /** Set the inline font size (any CSS length, e.g. "1.5em") on the selection. */
      setFontSize: (size: string) => ReturnType;
      /** Remove an inline font size from the selection. */
      unsetFontSize: () => ReturnType;
    };
  }
}

/**
 * Adds a `fontSize` attribute to the TextStyle mark so selected text in the
 * rich-text (INFO) editor can be enlarged. Stored as an inline style so the
 * read-only student view renders it with the same TextStyle extension.
 */
export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: { fontSize?: string | null }) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});
