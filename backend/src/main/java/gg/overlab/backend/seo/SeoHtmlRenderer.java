package gg.overlab.backend.seo;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class SeoHtmlRenderer {

    private static final String DISCLAIMER =
            "Overlab is an unofficial fan site and is not affiliated with Blizzard Entertainment.";
    private final SiteUrl siteUrl;

    public SeoHtmlRenderer(SiteUrl siteUrl) {
        this.siteUrl = siteUrl;
    }

    public String render(SeoPage page) {
        String title = SeoPageResolver.SITE_NAME.equals(page.title())
                ? page.title() : page.title() + " | " + SeoPageResolver.SITE_NAME;
        String url = siteUrl.absolute(page.path());
        String image = siteUrl.absolute("/og-image.png");
        StringBuilder html = new StringBuilder("<!doctype html>\n<html lang=\"en\">\n<head>\n")
                .append("<meta charset=\"UTF-8\">\n")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
                .append("<title>").append(escape(title)).append("</title>\n");
        meta(html, "name", "description", page.description());
        html.append("<link rel=\"canonical\" href=\"").append(escape(url)).append("\">\n");
        meta(html, "property", "og:type", page.openGraphType());
        meta(html, "property", "og:site_name", SeoPageResolver.SITE_NAME);
        meta(html, "property", "og:title", title);
        meta(html, "property", "og:description", page.description());
        meta(html, "property", "og:url", url);
        meta(html, "property", "og:image", image);
        meta(html, "property", "og:image:width", "1200");
        meta(html, "property", "og:image:height", "630");
        meta(html, "name", "twitter:card", "summary_large_image");
        meta(html, "name", "twitter:title", title);
        meta(html, "name", "twitter:description", page.description());
        meta(html, "name", "twitter:image", image);
        page.structuredData().forEach(json -> html.append("<script type=\"application/ld+json\">")
                .append(json).append("</script>\n"));
        html.append("</head>\n<body>\n<h1>").append(escape(page.heading())).append("</h1>\n")
                .append("<p>").append(escape(page.description())).append("</p>\n<nav>\n");
        StaticSeoPage.navigationPages().forEach(link -> html.append("<a href=\"")
                .append(escape(siteUrl.absolute(link.path()))).append("\">")
                .append(escape(link.heading())).append("</a>\n"));
        return html.append("</nav>\n<p>").append(escape(DISCLAIMER)).append("</p>\n</body>\n</html>\n").toString();
    }

    public String renderNotFound() {
        return "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n"
                + "<meta name=\"robots\" content=\"noindex\">\n<title>Page not found | "
                + SeoPageResolver.SITE_NAME + "</title>\n</head>\n<body>\n<h1>Page not found</h1>\n</body>\n</html>\n";
    }

    private void meta(StringBuilder html, String attribute, String name, String content) {
        html.append("<meta ").append(attribute).append("=\"").append(escape(name)).append("\" content=\"")
                .append(escape(content)).append("\">\n");
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value);
    }
}
