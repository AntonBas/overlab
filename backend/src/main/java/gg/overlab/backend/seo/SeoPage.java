package gg.overlab.backend.seo;

import java.util.List;

public record SeoPage(
        String path,
        String title,
        String description,
        String openGraphType,
        String heading,
        List<String> structuredData) {
}
