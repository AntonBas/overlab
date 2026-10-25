package gg.overlab.backend.hero;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.dto.HeroDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HeroService {

    public static final String CACHE_NAME = "heroes";

    private final HeroRepository heroRepository;
    private final HeroMapper heroMapper;

    @Cacheable(value = CACHE_NAME, key = "'all'")
    @Transactional(readOnly = true)
    public List<HeroDto> findAll() {
        return heroRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(heroMapper::toDto)
                .toList();
    }

    @Cacheable(value = CACHE_NAME, key = "#slug")
    @Transactional(readOnly = true)
    public HeroDto getBySlug(String slug) {
        Hero hero = heroRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", slug));
        return heroMapper.toDto(hero);
    }
}
