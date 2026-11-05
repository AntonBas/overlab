package gg.overlab.backend.hero.category.dto;

import java.util.List;

public record CategoryAdminDto(Long id, String slug, String name, String description, List<String> heroSlugs) {
}
