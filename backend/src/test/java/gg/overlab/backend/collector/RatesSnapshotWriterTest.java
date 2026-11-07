package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroRoleChange;
import gg.overlab.backend.hero.HeroRoleChangeRepository;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class RatesSnapshotWriterTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final HeroRoleChangeRepository roleChangeRepository = mock(HeroRoleChangeRepository.class);
    private final CollectorMetrics metrics = mock(CollectorMetrics.class);
    private final RatesSnapshotWriter writer = new RatesSnapshotWriter(heroRepository,
            roleChangeRepository, mock(GameMapRepository.class), mock(HeroStatRepository.class), mock(SnapshotQualityChecker.class),
            metrics, mock(HeroPortraitDownloader.class), mock(RoleIconDownloader.class));

    @Test
    void recordsARoleChangeWhenBlizzardMovesAHeroToAnotherRole() {
        stubExistingHero(HeroRole.DAMAGE);

        save("support");

        verify(metrics).recordRoleChange();
        ArgumentCaptor<HeroRoleChange> saved = ArgumentCaptor.forClass(HeroRoleChange.class);
        verify(roleChangeRepository).save(saved.capture());
        assertThat(saved.getValue().getPreviousRole()).isEqualTo(HeroRole.DAMAGE);
        assertThat(saved.getValue().getNewRole()).isEqualTo(HeroRole.SUPPORT);
        assertThat(saved.getValue().getChangedAt()).isEqualTo(Instant.parse("2026-11-07T10:00:00Z"));
    }

    @Test
    void doesNotRecordARoleChangeWhenTheRoleIsTheSame() {
        stubExistingHero(HeroRole.SUPPORT);

        save("support");

        verify(metrics, never()).recordRoleChange();
        verify(roleChangeRepository, never()).save(any(HeroRoleChange.class));
    }

    @Test
    void marksAHeroFoundAfterTheFirstCollectionAsIntroduced() {
        Hero known = new Hero();
        known.setSlug("ana");
        known.setName("Ana");
        known.setRole(HeroRole.SUPPORT);
        when(heroRepository.findAll()).thenReturn(List.of(known));
        when(heroRepository.save(any(Hero.class))).thenAnswer(invocation -> invocation.getArgument(0));

        save("support");

        ArgumentCaptor<Hero> saved = ArgumentCaptor.forClass(Hero.class);
        verify(heroRepository, atLeastOnce()).save(saved.capture());
        Hero sombra = saved.getAllValues().stream().filter(hero -> "sombra".equals(hero.getSlug())).findFirst()
                .orElseThrow();
        assertThat(sombra.getIntroducedAt()).isEqualTo(Instant.parse("2026-11-07T10:00:00Z"));
    }

    @Test
    void doesNotMarkHeroesOfTheVeryFirstCollectionAsNew() {
        when(heroRepository.findAll()).thenReturn(List.of());
        when(heroRepository.save(any(Hero.class))).thenAnswer(invocation -> invocation.getArgument(0));

        save("support");

        ArgumentCaptor<Hero> saved = ArgumentCaptor.forClass(Hero.class);
        verify(heroRepository).save(saved.capture());
        assertThat(saved.getValue().getIntroducedAt()).isNull();
    }

    @Test
    void doesNotRecordARoleChangeForANewHero() {
        when(heroRepository.findAll()).thenReturn(List.of());
        when(heroRepository.save(any(Hero.class))).thenAnswer(invocation -> invocation.getArgument(0));

        save("support");

        verify(metrics, never()).recordRoleChange();
        verify(metrics).recordNewHero("sombra");
    }

    private void stubExistingHero(HeroRole role) {
        Hero hero = new Hero();
        hero.setSlug("sombra");
        hero.setName("Sombra");
        hero.setRole(role);
        when(heroRepository.findAll()).thenReturn(List.of(hero));
        when(heroRepository.save(any(Hero.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private void save(String role) {
        BlizzardRatesResponse.HeroRate rate = new BlizzardRatesResponse.HeroRate("sombra",
                new BlizzardRatesResponse.Cells("Sombra", new BigDecimal("50"), new BigDecimal("10"),
                        new BigDecimal("5")),
                new BlizzardRatesResponse.HeroInfo("Sombra", role, null, null, null));
        writer.save(Instant.parse("2026-11-07T10:00:00Z"), GameQueue.COMPETITIVE, GameFormat.FIVE_VS_FIVE,
                Platform.PC, Region.EUROPE, RankTier.ALL, RatesSnapshotWriter.ALL_MAPS, List.of(rate));
    }
}
