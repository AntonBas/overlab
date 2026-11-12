package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;

class CurrentGameFormatTest {

    private final HeroStatRepository repository = mock(HeroStatRepository.class);
    private final CurrentGameFormat currentGameFormat = new CurrentGameFormat(repository);

    @Test
    void usesTheFormatOfTheMostRecentSnapshot() {
        HeroStat latest = new HeroStat();
        latest.setGameFormat(GameFormat.SIX_VS_SIX);
        when(repository.findFirstByOrderByCapturedAtDesc()).thenReturn(Optional.of(latest));

        assertThat(currentGameFormat.get()).isEqualTo(GameFormat.SIX_VS_SIX);
    }

    @Test
    void fallsBackToFiveVsFiveWhenNothingWasCollectedYet() {
        when(repository.findFirstByOrderByCapturedAtDesc()).thenReturn(Optional.empty());

        assertThat(currentGameFormat.get()).isEqualTo(GameFormat.FIVE_VS_FIVE);
    }
}
