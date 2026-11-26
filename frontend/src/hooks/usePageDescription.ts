import { useEffect } from "react";

const MAX_LENGTH = 160;

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("content") ?? null;
}

function setMeta(selector: string, content: string | null) {
  const element = document.head.querySelector(selector);
  if (element && content !== null) {
    element.setAttribute("content", content);
  }
}

export function plainDescription(text: string | null | undefined): string {
  const readable = (text ?? "")
    .replace(/\[\[[^\]/]+\/([^\]]+)\]\]/g, (_, slug: string) =>
      slug.replace(/-/g, " "),
    )
    .replace(/\s+/g, " ")
    .trim();
  return readable.length > MAX_LENGTH
    ? `${readable.slice(0, MAX_LENGTH - 1).trimEnd()}…`
    : readable;
}

export function usePageDescription(
  description: string | null | undefined,
  canonicalPath?: string,
) {
  useEffect(() => {
    if (!description) {
      return undefined;
    }
    const previous = metaContent('meta[name="description"]');
    const previousOg = metaContent('meta[property="og:description"]');
    const previousTwitter = metaContent('meta[name="twitter:description"]');
    const previousUrl = metaContent('meta[property="og:url"]');
    const pageUrl = `${window.location.origin}${canonicalPath ?? window.location.pathname}`;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[property="og:url"]', pageUrl);

    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = pageUrl;
    document.head.appendChild(canonical);

    return () => {
      setMeta('meta[name="description"]', previous);
      setMeta('meta[property="og:description"]', previousOg);
      setMeta('meta[name="twitter:description"]', previousTwitter);
      setMeta('meta[property="og:url"]', previousUrl);
      canonical.remove();
    };
  }, [description, canonicalPath]);
}
