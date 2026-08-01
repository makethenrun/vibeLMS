"use client";

/** Converts common video URLs to an embeddable form; falls back to <video>. */
function toEmbed(url: string): { kind: "iframe" | "file"; src: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  return { kind: "file", src: trimmed };
}

export function VideoEmbed({ url }: { url: string }) {
  const embed = toEmbed(url);
  if (!embed) return <p className="text-sm text-muted-foreground">Ссылка на видео не указана.</p>;

  if (embed.kind === "iframe") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border">
        <iframe
          src={embed.src}
          title="Видео"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video controls src={embed.src} className="w-full rounded-lg border" />;
}
