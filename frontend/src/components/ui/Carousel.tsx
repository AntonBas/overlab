import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { preferredScrollBehavior } from "../../utils/motion";

interface CarouselProps {
  items: { key: string | number; content: ReactNode }[];
  itemsPerView: number;
  rows?: number;
  previousLabel: string;
  nextLabel: string;
  resetKey?: string;
}

const SCROLL_TOLERANCE_PX = 1;

export function Carousel({
  items,
  itemsPerView,
  rows = 1,
  previousLabel,
  nextLabel,
  resetKey,
}: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setCanScrollBack(track.scrollLeft > SCROLL_TOLERANCE_PX);
    setCanScrollForward(
      track.scrollLeft + track.clientWidth <
        track.scrollWidth - SCROLL_TOLERANCE_PX,
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState, items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (track) {
      track.scrollLeft = 0;
    }
    updateScrollState();
  }, [resetKey, updateScrollState]);

  function scrollBy(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (track.clientWidth + gap),
      behavior: preferredScrollBehavior(),
    });
  }

  const scrollable = canScrollBack || canScrollForward;
  const pageSize = itemsPerView * rows;
  const pages = Array.from(
    { length: Math.ceil(items.length / pageSize) },
    (_, index) => items.slice(index * pageSize, (index + 1) * pageSize),
  );

  return (
    <div
      className={clsx("carousel", { "carousel--scrollable": scrollable })}
      style={{ "--carousel-items": itemsPerView } as CSSProperties}
    >
      {scrollable && (
        <button
          type="button"
          className="carousel__button carousel__button--back"
          aria-label={previousLabel}
          disabled={!canScrollBack}
          onClick={() => scrollBy(-1)}
        >
          &lsaquo;
        </button>
      )}
      <ul
        ref={trackRef}
        className={clsx("carousel__track", {
          "carousel__track--paged": rows > 1,
        })}
        onScroll={updateScrollState}
      >
        {rows > 1
          ? pages.map((page) => (
              <li key={page[0].key} className="carousel__page">
                <ul className="carousel__grid">
                  {page.map((item) => (
                    <li key={item.key}>{item.content}</li>
                  ))}
                </ul>
              </li>
            ))
          : items.map((item) => (
              <li key={item.key} className="carousel__item">
                {item.content}
              </li>
            ))}
      </ul>
      {scrollable && (
        <button
          type="button"
          className="carousel__button carousel__button--forward"
          aria-label={nextLabel}
          disabled={!canScrollForward}
          onClick={() => scrollBy(1)}
        >
          &rsaquo;
        </button>
      )}
    </div>
  );
}
