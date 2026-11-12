package gg.overlab.backend.guide;

import gg.overlab.backend.guide.dto.GuideDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Guides")
@RestController
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;

    @Operation(summary = "List published guides, optionally filtered by hero")
    @GetMapping("/api/guides")
    public List<GuideDto> findPublished(@RequestParam(required = false) String hero,
                                        @RequestParam(required = false) String map) {
        return guideService.findPublished(hero, map);
    }

    @Operation(summary = "Get a published guide by its path")
    @GetMapping("/api/guides/{path}")
    public GuideDto getByPath(@PathVariable String path) {
        return guideService.getPublishedByPath(path);
    }
}
