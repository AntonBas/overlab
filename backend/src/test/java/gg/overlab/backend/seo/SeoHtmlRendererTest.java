package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class SeoHtmlRendererTest {

    private final SeoHtmlRenderer renderer = new SeoHtmlRenderer(new SiteUrl("https://example.com/"));

    @Test
    void rendersMetadataCanonicalAndStructuredData() {
        SeoPage page = new SeoPage("/maps/busan", "Busan", "Busan stats", "website", "Busan",
                List.of("{\"@type\":\"BreadcrumbList\"}"));

        String html = renderer.render(page);

        assertThat(html).contains("<title>Busan | Overlab</title>",
                "<link rel=\"canonical\" href=\"https://example.com/maps/busan\">",
                "property=\"og:image\" content=\"https://example.com/og-image.png\"",
                "name=\"twitter:card\" content=\"summary_large_image\"",
                "<script type=\"application/ld+json\">{\"@type\":\"BreadcrumbList\"}</script>",
                "not affiliated with Blizzard Entertainment");
    }

    @Test
    void homePageKeepsPlainSiteTitleAndRootCanonical() {
        String html = renderer.render(new SeoPage("/", "Overlab", "d", "website", "Overlab", List.of()));

        assertThat(html).contains("<title>Overlab</title>", "href=\"https://example.com/\"");
    }

    @Test
    void escapesUntrustedText() {
        SeoPage page = new SeoPage("/heroes/x", "<script>alert(1)</script>", "\"quoted\" & <b>", "website",
                "<img src=x>", List.of());

        String html = renderer.render(page);

        assertThat(html).doesNotContain("<script>alert", "<img src=x>", "<b>");
        assertThat(html).contains("&lt;script&gt;", "&quot;quoted&quot; &amp;");
    }

    @Test
    void notFoundPageIsNotIndexable() {
        assertThat(renderer.renderNotFound()).contains("noindex", "Page not found");
    }
}
