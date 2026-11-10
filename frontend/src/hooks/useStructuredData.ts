import { useEffect } from "react";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbList(items: BreadcrumbItem[], origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

export function serializeStructuredData(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function useStructuredData(data: object | null | undefined) {
  const serialized = data ? serializeStructuredData(data) : null;

  useEffect(() => {
    if (!serialized) {
      return undefined;
    }
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = serialized;
    document.head.appendChild(script);
    return () => script.remove();
  }, [serialized]);
}
