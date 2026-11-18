import { useEffect } from "react";

const SLIDE = "segmented--slide";
const ANIMATE = "segmented--animate";

function isSingleRow(container: HTMLElement): boolean {
  return getComputedStyle(container).flexWrap === "nowrap";
}

function place(container: HTMLElement) {
  const active = container.querySelector<HTMLElement>(
    ".segmented__item--active",
  );
  if (!active || !isSingleRow(container)) {
    container.classList.remove(SLIDE, ANIMATE);
    return;
  }
  container.style.setProperty("--seg-x", `${active.offsetLeft}px`);
  container.style.setProperty("--seg-w", `${active.offsetWidth}px`);
  if (!container.classList.contains(SLIDE)) {
    container.classList.add(SLIDE);
    window.requestAnimationFrame(() => container.classList.add(ANIMATE));
  }
}

function placeAll() {
  document
    .querySelectorAll<HTMLElement>(".segmented")
    .forEach((container) => place(container));
}

export function useSegmentedIndicator() {
  useEffect(() => {
    let frame = 0;
    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(placeAll);
    }
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-pressed"],
    });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);
}
