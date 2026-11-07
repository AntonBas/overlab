package gg.overlab.backend.content;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.exception.api.ApiErrorHandler;
import gg.overlab.backend.guide.GuideController;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.hero.category.HeroCategoryController;
import gg.overlab.backend.hero.category.HeroCategoryService;
import gg.overlab.backend.hero.perk.PerkController;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.relation.HeroRelationController;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.patch.PatchController;
import gg.overlab.backend.patch.PatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AdminContentControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new GuideController(mock(GuideService.class)),
                        new PerkController(mock(PerkService.class)),
                        new HeroRelationController(mock(HeroRelationService.class)),
                        new HeroCategoryController(mock(HeroCategoryService.class)),
                        new PatchController(mock(PatchService.class)))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    @Test
    void guideRejectsMalformedYoutubeIdAndNegativeStart() throws Exception {
        mockMvc.perform(post("/api/admin/guides").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroSlug\":\"illari\",\"title\":\"T\",\"youtubeId\":\"short\",\"startSeconds\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors[?(@.field=='youtubeId')]").exists())
                .andExpect(jsonPath("$.subErrors[?(@.field=='startSeconds')]").exists());
    }

    @Test
    void guideRejectsInvalidSlugFormat() throws Exception {
        mockMvc.perform(post("/api/admin/guides").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroSlug\":\"illari\",\"title\":\"T\",\"slug\":\"Bad Slug\",\"youtubeId\":\"dQw4w9WgXcQ\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors[?(@.field=='slug')]").exists());
    }

    @Test
    void categoryRequiresALowercaseSlug() throws Exception {
        mockMvc.perform(post("/api/admin/hero-categories").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"Not A Slug\",\"name\":\"Beam\",\"heroSlugs\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors[?(@.field=='slug')]").exists());
    }

    @Test
    void perkRequiresSlotAndRecommendation() throws Exception {
        mockMvc.perform(post("/api/admin/perks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroSlug\":\"ana\",\"name\":\"Perk\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors[?(@.field=='slot')]").exists())
                .andExpect(jsonPath("$.subErrors[?(@.field=='recommendation')]").exists());
    }

    @Test
    void patchRequiresVersionAndReleaseDate() throws Exception {
        mockMvc.perform(post("/api/admin/patches").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors[?(@.field=='version')]").exists())
                .andExpect(jsonPath("$.subErrors[?(@.field=='releasedAt')]").exists());
    }
}
