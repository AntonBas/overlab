package gg.overlab.backend.collector.media;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class HeroAssetServiceTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final HeroPortraitDownloader portraitDownloader = mock(HeroPortraitDownloader.class);
    private final RoleIconDownloader roleIconDownloader = mock(RoleIconDownloader.class);
    private final HeroAssetService service = new HeroAssetService(heroRepository, portraitDownloader,
            roleIconDownloader);

    private BlizzardRatesResponse.HeroRate rate(String id) {
        return new BlizzardRatesResponse.HeroRate(id, new BlizzardRatesResponse.Cells(id, null, null, null),
                new BlizzardRatesResponse.HeroInfo(id, "tank", "main", "https://img/" + id + ".png",
                        "https://img/tank.svg"));
    }

    private Hero hero(String slug) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        return hero;
    }

    @Test
    void savesAHeroOnlyWhenItsPortraitWasDownloaded() {
        Hero withNewPortrait = hero("ana");
        Hero unchanged = hero("dva");
        when(heroRepository.findAllBySlugIn(any())).thenReturn(List.of(withNewPortrait, unchanged));
        doAnswer(invocation -> {
            ((Hero) invocation.getArgument(0)).setPortraitUrl("heroes/ana.webp");
            return null;
        }).when(portraitDownloader).ensurePortrait(withNewPortrait, "https://img/ana.png");

        service.ensureAssets(List.of(rate("ana"), rate("dva")));

        verify(heroRepository).save(withNewPortrait);
        verify(heroRepository, never()).save(unchanged);
        verify(roleIconDownloader, times(2)).ensureRoleIcon("tank", "https://img/tank.svg");
    }
}
