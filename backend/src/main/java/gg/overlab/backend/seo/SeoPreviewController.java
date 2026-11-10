package gg.overlab.backend.seo;

import java.time.Duration;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "SEO")
@RestController
@RequiredArgsConstructor
public class SeoPreviewController {

    private static final int MAX_PATH_LENGTH = 200;

    private final SeoPreviewService previewService;

    @Operation(summary = "Static HTML with page metadata for link previews and social crawlers")
    @GetMapping(value = "/api/seo/preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> preview(@RequestParam(defaultValue = "/") String path) {
        String html = path.length() > MAX_PATH_LENGTH ? null : previewService.renderPreview(path);
        if (html == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(previewService.renderNotFound());
        }
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic()).body(html);
    }
}
