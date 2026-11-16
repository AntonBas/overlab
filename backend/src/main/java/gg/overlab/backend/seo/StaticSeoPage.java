package gg.overlab.backend.seo;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.core.io.ClassPathResource;

record StaticSeoPage(String path, String title, String description, String heading, boolean navigation) {

    private static final String RESOURCE = "seo/static-pages.json";
    private static final List<StaticSeoPage> ALL = load();

    static final String SITE_NAME = "Overlab";
    static final String HOME_DESCRIPTION = find("/").map(StaticSeoPage::description).orElseThrow();

    static Optional<StaticSeoPage> find(String path) {
        return ALL.stream().filter(page -> page.path().equals(path)).findFirst();
    }

    static List<StaticSeoPage> navigationPages() {
        return ALL.stream().filter(StaticSeoPage::navigation).toList();
    }

    private static List<StaticSeoPage> load() {
        try (InputStream stream = new ClassPathResource(RESOURCE).getInputStream()) {
            String json = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            return JsonParserFactory.getJsonParser().parseList(json).stream()
                    .map(entry -> toPage(asMap(entry)))
                    .toList();
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object entry) {
        return (Map<String, Object>) entry;
    }

    private static StaticSeoPage toPage(Map<String, Object> entry) {
        return new StaticSeoPage((String) entry.get("path"), (String) entry.get("title"),
                (String) entry.get("description"), (String) entry.get("heading"),
                Boolean.TRUE.equals(entry.get("navigation")));
    }
}
