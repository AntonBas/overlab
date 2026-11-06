package gg.overlab.backend.hero.category.dto;

import gg.overlab.backend.hero.category.CategoryMatchupType;
import java.io.Serializable;

public record CategoryMatchupDto(String heroSlug, String categorySlug, CategoryMatchupType type, String note) implements Serializable {
}
