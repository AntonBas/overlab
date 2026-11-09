import type { Guide } from "../../../types/api";

export function GuideEmbed({ guide }: { guide: Guide }) {
  return (
    <div className="video-frame">
      <iframe
        src={guide.embedUrl}
        title={guide.title}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
