package gg.overlab.backend.hero.category.dto;

import java.io.Serializable;
import java.util.List;

public record HeroCategoryDto(String slug, String name, String description,
                              List<CategoryMemberDto> heroes) implements Serializable {
}
