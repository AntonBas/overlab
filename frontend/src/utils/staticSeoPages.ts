import pages from "../../../backend/src/main/resources/seo/static-pages.json";

export interface StaticSeoPage {
  path: string;
  title: string;
  description: string;
  heading: string;
  navigation: boolean;
}

export function staticSeoPage(path: string): StaticSeoPage {
  const page = pages.find((entry) => entry.path === path);
  if (!page) {
    throw new Error(`No static SEO page for ${path}`);
  }
  return page;
}
