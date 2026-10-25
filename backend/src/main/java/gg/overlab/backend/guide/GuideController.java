package gg.overlab.backend.guide;

import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.guide.dto.GuideRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;

    @GetMapping("/api/guides")
    public List<GuideDto> findPublished(@RequestParam(required = false) String hero,
                                        @RequestParam(required = false) String map) {
        return guideService.findPublished(hero, map);
    }

    @GetMapping("/api/guides/{path}")
    public GuideDto getByPath(@PathVariable String path) {
        return guideService.getPublishedByPath(path);
    }

    @GetMapping("/api/admin/guides")
    public List<GuideDto> findAllForAdmin() {
        return guideService.findAllForAdmin();
    }

    @PostMapping("/api/admin/guides")
    @ResponseStatus(HttpStatus.CREATED)
    public GuideDto create(@Valid @RequestBody GuideRequest request) {
        return guideService.create(request);
    }

    @PutMapping("/api/admin/guides/{id}")
    public GuideDto update(@PathVariable Long id, @Valid @RequestBody GuideRequest request) {
        return guideService.update(id, request);
    }

    @DeleteMapping("/api/admin/guides/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        guideService.delete(id);
    }
}
