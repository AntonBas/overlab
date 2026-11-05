package gg.overlab.backend.hero.category.dto;

import gg.overlab.backend.hero.category.CategoryMatchupType;

public record CategoryMatchupAdminDto(Long id, String heroSlug, String categorySlug, CategoryMatchupType type,
                                      int strength, String note) {
}
