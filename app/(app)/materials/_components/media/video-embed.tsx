"use client";

type Embed = { kind: "iframe" | "file"; src: string };

/**
 * Converts a video URL from a known service to an embeddable iframe src.
 * Anything not recognised falls back to a direct <video> file.
 */
function toEmbed(url: string): Embed | null {
  const raw = url.trim();
  if (!raw) return null;

  // --- YouTube: watch / youtu.be / embed / shorts / live / v, incl. -nocookie & m. ---
  const yt = raw.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^"'\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  // --- Vimeo: vimeo.com/ID, player.vimeo.com/video/ID, private ID/HASH ---
  const vimeo = raw.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (vimeo) {
    const hash = vimeo[2] ? `?h=${vimeo[2]}` : "";
    return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}${hash}` };
  }

  // --- VK Video: existing video_ext embed, or vk.com/video{OID}_{ID} ---
  if (/vk(?:video)?\.(?:com|ru)\/video_ext\.php/.test(raw)) {
    return { kind: "iframe", src: raw };
  }
  const vk = raw.match(/vk(?:video)?\.(?:com|ru)\/video(-?\d+)_(\d+)/);
  if (vk) {
    return { kind: "iframe", src: `https://vk.com/video_ext.php?oid=${vk[1]}&id=${vk[2]}&hd=2` };
  }

  // --- RuTube: rutube.ru/video/HASH or already-embed ---
  const rutube = raw.match(/rutube\.ru\/(?:video(?:\/private)?|play\/embed)\/([\w]+)/);
  if (rutube) return { kind: "iframe", src: `https://rutube.ru/play/embed/${rutube[1]}` };

  // --- Dailymotion: dailymotion.com/video/ID or dai.ly/ID ---
  const dm = raw.match(/(?:dailymotion\.com\/(?:video|embed\/video)|dai\.ly)\/([a-zA-Z0-9]+)/);
  if (dm) return { kind: "iframe", src: `https://www.dailymotion.com/embed/video/${dm[1]}` };

  // --- Google Drive: drive.google.com/file/d/ID ---
  const gd = raw.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return { kind: "iframe", src: `https://drive.google.com/file/d/${gd[1]}/preview` };

  // --- Bilibili: bilibili.com/video/BVxxxx (Chinese content) ---
  const bili = raw.match(/bilibili\.com\/video\/(BV[\w]+)/);
  if (bili) {
    return { kind: "iframe", src: `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0` };
  }

  // --- Fallback: treat as a direct media file (.mp4/.webm/.ogg, Supabase storage, …) ---
  return { kind: "file", src: raw };
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
