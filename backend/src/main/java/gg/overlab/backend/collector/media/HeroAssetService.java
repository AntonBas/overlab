package gg.overlab.backend.collector.media;

import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HeroAssetService {

    private final HeroRepository heroRepository;
    private final HeroPortraitDownloader portraitDownloader;
    private final RoleIconDownloader roleIconDownloader;

    public void ensureAssets(List<BlizzardRatesResponse.HeroRate> rates) {
        rates.forEach(rate -> roleIconDownloader.ensureRoleIcon(rate.hero().role(), rate.hero().roleIcon()));
        Set<String> slugs = rates.stream().map(BlizzardRatesResponse.HeroRate::id).collect(Collectors.toSet());
        for (Hero hero : heroRepository.findAllBySlugIn(slugs)) {
            try {
                ensurePortrait(hero, rates);
            } catch (RuntimeException exception) {
                log.warn("Portrait of {} could not be stored: {}", hero.getSlug(), exception.getMessage());
            }
        }
    }

    private void ensurePortrait(Hero hero, List<BlizzardRatesResponse.HeroRate> rates) {
        String portraitBefore = hero.getPortraitUrl();
        rates.stream()
                .filter(rate -> rate.id().equals(hero.getSlug()))
                .findFirst()
                .ifPresent(rate -> portraitDownloader.ensurePortrait(hero, rate.hero().portrait()));
        if (!Objects.equals(portraitBefore, hero.getPortraitUrl())) {
            heroRepository.save(hero);
        }
    }
}
