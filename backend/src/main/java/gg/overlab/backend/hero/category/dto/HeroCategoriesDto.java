package gg.overlab.backend.hero.category.dto;

import java.io.Serializable;
import java.util.List;

public record HeroCategoriesDto(List<HeroCategoryDto> categories,
                                List<CategoryMatchupDto> matchups) implements Serializable {
}
