package gg.overlab.backend.collector;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.collector.dto.CollectorRunDto;
import gg.overlab.backend.collector.imports.HeroContentImportService;
import gg.overlab.backend.collector.imports.PatchImportService;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.exception.api.ApiErrorHandler;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.RankTier;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CollectorAdminControllerTest {

    private final RatesCollectorService collectorService = mock(RatesCollectorService.class);
    private final AuditService auditService = mock(AuditService.class);
    private final HeroContentImportService contentImportService = mock(HeroContentImportService.class);
    private final PatchImportService patchImportService = mock(PatchImportService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CollectorAdminController(collectorService, auditService,
                        contentImportService, patchImportService))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    private CollectorRunDto run() {
        return new CollectorRunDto(7L, "daily-overview", CollectorTrigger.MANUAL, CollectorRunStatus.RUNNING,
                Instant.parse("2026-11-12T04:00:00Z"), null, 0, 0, 0, null);
    }

    @Test
    void listsJobsWithTheirSchedule() throws Exception {
        CollectorJob job = CollectorFixtures.job("daily-overview", List.of(GameQueue.COMPETITIVE),
                List.of(RankTier.ALL), List.of("all-maps"));
        when(collectorService.jobs()).thenReturn(List.of(job, CollectorFixtures.chainedJob("daily-maps",
                "daily-overview", Duration.ofDays(2))));

        mockMvc.perform(get("/api/admin/collector/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("daily-overview"))
                .andExpect(jsonPath("$[1].after").value("daily-overview"))
                .andExpect(jsonPath("$[1].minInterval").value("PT48H"));
    }

    @Test
    void listsRecentRuns() throws Exception {
        when(collectorService.recentRuns()).thenReturn(List.of(run()));

        mockMvc.perform(get("/api/admin/collector/runs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobName").value("daily-overview"));
    }

    @Test
    void startingAJobIsAcceptedAndAudited() throws Exception {
        when(collectorService.startAsync("daily-overview", CollectorTrigger.MANUAL)).thenReturn(run());

        mockMvc.perform(post("/api/admin/collector/jobs/daily-overview/run"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("RUNNING"));

        verify(auditService).logCreate(AuditEntityType.COLLECTOR_RUN, 7L, run());
    }

    @Test
    void startsTheHeroContentImportInTheBackground() throws Exception {
        when(contentImportService.startAsync()).thenReturn(52);

        mockMvc.perform(post("/api/admin/collector/perks/import"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.heroes").value(52));
    }

    @Test
    void importsPatchesInTheBackgroundAndAnswersAccepted() throws Exception {
        mockMvc.perform(post("/api/admin/collector/patches/import"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.started").value(true));

        verify(patchImportService).startAsync();
    }
}
