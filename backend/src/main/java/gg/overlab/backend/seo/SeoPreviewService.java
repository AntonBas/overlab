package gg.overlab.backend.seo;

import gg.overlab.backend.config.cache.CacheNames;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class SeoPreviewService {

    private final SeoPageResolver resolver;
    private final SeoHtmlRenderer renderer;

    public SeoPreviewService(SeoPageResolver resolver, SeoHtmlRenderer renderer) {
        this.resolver = resolver;
        this.renderer = renderer;
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'seo:' + #path", unless = "#result == null")
    public String renderPreview(String path) {
        Optional<SeoPage> page = resolver.resolve(path);
        return page.map(renderer::render).orElse(null);
    }

    public String renderNotFound() {
        return renderer.renderNotFound();
    }
}
