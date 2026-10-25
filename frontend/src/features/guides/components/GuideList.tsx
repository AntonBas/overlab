import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import type { Guide } from "../../../types/api";
import { formatSeconds } from "../../../utils/format";

export function GuideList({ guides }: { guides: Guide[] }) {
  return (
    <ul className="card-list">
      {guides.map((guide) => (
        <li key={guide.id}>
          <Link to={`/guides/${guide.path}`} className="card card--link">
            <PlayCircle aria-hidden="true" size={22} />
            <span className="card__body">
              <strong>{guide.title}</strong>
              <span className="muted">
                {[guide.heroName, guide.mapName].filter(Boolean).join(" on ")}
                {guide.startSeconds > 0 &&
                  ` | starts at ${formatSeconds(guide.startSeconds)}`}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
