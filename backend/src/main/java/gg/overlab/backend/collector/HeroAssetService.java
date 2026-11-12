package gg.overlab.backend.collector;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}
