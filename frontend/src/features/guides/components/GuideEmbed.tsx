import type { Guide } from "../../../types/guide";

export function GuideEmbed({ guide }: { guide: Guide }) {
  return (
    <div className="video-frame">
      <iframe
        src={guide.embedUrl}
        title={guide.title}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        allowFullScreen
      />
    </div>
  );
}
