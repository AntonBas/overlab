package gg.overlab.backend.seo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "SEO")
@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final SitemapService sitemapService;

    @Operation(summary = "Sitemap of the public pages for search engines")
    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        return sitemapService.build();
    }
}
