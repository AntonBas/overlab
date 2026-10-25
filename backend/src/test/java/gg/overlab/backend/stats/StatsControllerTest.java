package gg.overlab.backend.stats;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.exception.api.ApiErrorHandler;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class StatsControllerTest {

    private final StatsService statsService = mock(StatsService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StatsController(statsService))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    @Test
    void usesCompetitiveAllMapsDefaults() throws Exception {
        StatsFilter expected = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC, Region.EUROPE);
        StatsSnapshotDto snapshot = new StatsSnapshotDto(StatsFixtures.CAPTURED_AT, GameQueue.COMPETITIVE, RankTier.ALL,
                "all-maps", Platform.PC, Region.EUROPE, List.of());
        when(statsService.getStats(eq(expected), eq(null), eq(StatsSort.PICK_RATE), eq(true))).thenReturn(snapshot);

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.queue").value("COMPETITIVE"))
                .andExpect(jsonPath("$.map").value("all-maps"));
    }

    @Test
    void passesRoleSortAndDirection() throws Exception {
        StatsFilter expected = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.GOLD, "rialto", Platform.PC, Region.EUROPE);
        StatsSnapshotDto snapshot = new StatsSnapshotDto(StatsFixtures.CAPTURED_AT, GameQueue.COMPETITIVE, RankTier.GOLD,
                "rialto", Platform.PC, Region.EUROPE, List.of());
        when(statsService.getStats(expected, HeroRole.SUPPORT, StatsSort.WIN_RATE, false)).thenReturn(snapshot);

        mockMvc.perform(get("/api/stats")
                        .param("tier", "GOLD").param("map", "rialto").param("role", "SUPPORT")
                        .param("sort", "WIN_RATE").param("direction", "ASC"))
                .andExpect(status().isOk());

        verify(statsService).getStats(expected, HeroRole.SUPPORT, StatsSort.WIN_RATE, false);
    }

    @Test
    void invalidEnumReturnsBadRequestWithApiError() throws Exception {
        mockMvc.perform(get("/api/stats").param("queue", "BAD"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.path").value("/api/stats"))
                .andExpect(jsonPath("$.subErrors[0].field").value("queue"));
    }

    @Test
    void missingStatisticsReturnsNotFoundWithApiError() throws Exception {
        when(statsService.getStats(any(), any(), any(), eq(true)))
                .thenThrow(new EntityNotFoundException("Statistics", "x"));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message").value("Statistics not found: x"));
    }
}
