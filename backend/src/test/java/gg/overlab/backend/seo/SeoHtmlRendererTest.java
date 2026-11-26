package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import java.util.List;
import org.junit.jupiter.api.Test;

class SeoHtmlRendererTest {

    private final GuideService guideService = mock(GuideService.class);
    private final SeoHtmlRenderer renderer =
            new SeoHtmlRenderer(new SiteUrl("https://example.com/"), guideService);

    @Test
    void rendersMetadataCanonicalAndStructuredData() {
        SeoPage page = new SeoPage("/maps/busan", "Busan", "Busan stats", "website", "Busan",
                List.of("{\"@type\":\"BreadcrumbList\"}"), List.of());

        String html = renderer.render(page);

        assertThat(html).contains("<title>Busan | Overlab</title>",
                "<link rel=\"canonical\" href=\"https://example.com/maps/busan\">",
                "property=\"og:image\" content=\"https://example.com/og-image.png\"",
                "name=\"twitter:card\" content=\"summary_large_image\"",
                "<script type=\"application/ld+json\">{\"@type\":\"BreadcrumbList\"}</script>",
                "not affiliated with Blizzard Entertainment");
    }

    @Test
    void linksTheGuidesHubOnlyWhenThereArePublishedGuides() {
        SeoPage page = new SeoPage("/maps/busan", "Busan", "d", "website", "Busan", List.of(), List.of());

        assertThat(renderer.render(page)).doesNotContain("https://example.com/guides\"")
                .contains("https://example.com/maps\"");

        when(guideService.findPublished(null, null)).thenReturn(List.of(mock(GuideDto.class)));

        assertThat(renderer.render(page)).contains("https://example.com/guides\"");
    }

    @Test
    void usesTheSquareImageWithASummaryCard() {
        SeoPage page = new SeoPage("/heroes/ana", "Ana", "d", "website", "Ana", List.of(), List.of(),
                "/media/heroes/ana.webp", true);

        String html = renderer.render(page);

        assertThat(html).contains("property=\"og:image\" content=\"https://example.com/media/heroes/ana.webp\"",
                "name=\"twitter:card\" content=\"summary\"");
        assertThat(html).doesNotContain("summary_large_image");
    }

    @Test
    void homePageKeepsPlainSiteTitleAndRootCanonical() {
        String html = renderer.render(new SeoPage("/", "Overlab", "d", "website", "Overlab", List.of(), List.of()));

        assertThat(html).contains("<title>Overlab</title>", "href=\"https://example.com/\"");
    }

    @Test
    void escapesUntrustedText() {
        SeoPage page = new SeoPage("/heroes/x", "<script>alert(1)</script>", "\"quoted\" & <b>", "website",
                "<img src=x>", List.of(), List.of());

        String html = renderer.render(page);

        assertThat(html).doesNotContain("<script>alert", "<img src=x>", "<b>");
        assertThat(html).contains("&lt;script&gt;", "&quot;quoted&quot; &amp;");
    }

    @Test
    void notFoundPageIsNotIndexable() {
        assertThat(renderer.renderNotFound()).contains("noindex", "Page not found");
    }

    @Test
    void rendersSectionsWithPlainAndLinkedItemsAndEscapesThem() {
        SeoPage page = new SeoPage("/heroes/ana", "Ana", "d", "website", "Ana", List.of(), List.of(
                new SeoSection("Abilities", List.of(SeoItem.plain("Sleep Dart: <b>bold</b>"))),
                new SeoSection("Counters", List.of(SeoItem.link("Reinhardt", "/heroes/reinhardt")))));

        String html = renderer.render(page);

        assertThat(html).contains("<h2>Abilities</h2>", "<li>Sleep Dart: &lt;b&gt;bold&lt;/b&gt;</li>",
                "<h2>Counters</h2>", "<li><a href=\"https://example.com/heroes/reinhardt\">Reinhardt</a></li>");
        assertThat(html).doesNotContain("<b>bold</b>");
    }
}
