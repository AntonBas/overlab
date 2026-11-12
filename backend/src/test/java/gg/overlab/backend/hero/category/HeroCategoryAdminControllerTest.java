package gg.overlab.backend.hero.category;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.exception.api.ApiErrorHandler;
import gg.overlab.backend.hero.category.dto.CategoryAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupAdminDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HeroCategoryAdminControllerTest {

    private static final String CATEGORY_BODY = "{\"slug\":\"beam\",\"name\":\"Beam heroes\",\"heroSlugs\":[\"symmetra\"]}";
    private static final String MATCHUP_BODY =
            "{\"heroSlug\":\"zarya\",\"categorySlug\":\"beam\",\"type\":\"STRONG_AGAINST\"}";

    private final HeroCategoryService categoryService = mock(HeroCategoryService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new HeroCategoryAdminController(categoryService))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    @Test
    void listsCategoriesAndMatchups() throws Exception {
        when(categoryService.findCategoriesForAdmin()).thenReturn(List.of(
                new CategoryAdminDto(1L, "beam", "Beam heroes", null, List.of("symmetra"))));
        when(categoryService.findMatchupsForAdmin()).thenReturn(List.of(
                new CategoryMatchupAdminDto(2L, "zarya", "beam", CategoryMatchupType.STRONG_AGAINST, null)));

        mockMvc.perform(get("/api/admin/hero-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("beam"));
        mockMvc.perform(get("/api/admin/hero-category-relations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("STRONG_AGAINST"));
    }

    @Test
    void createsUpdatesAndDeletesACategory() throws Exception {
        CategoryAdminDto dto = new CategoryAdminDto(1L, "beam", "Beam heroes", null, List.of("symmetra"));
        when(categoryService.createCategory(any())).thenReturn(dto);
        when(categoryService.updateCategory(any(), any())).thenReturn(dto);

        mockMvc.perform(post("/api/admin/hero-categories").contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORY_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
        mockMvc.perform(put("/api/admin/hero-categories/1").contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORY_BODY))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/admin/hero-categories/1")).andExpect(status().isNoContent());

        verify(categoryService).deleteCategory(1L);
    }

    @Test
    void createsUpdatesAndDeletesAMatchup() throws Exception {
        CategoryMatchupAdminDto dto =
                new CategoryMatchupAdminDto(2L, "zarya", "beam", CategoryMatchupType.STRONG_AGAINST, null);
        when(categoryService.createMatchup(any())).thenReturn(dto);
        when(categoryService.updateMatchup(any(), any())).thenReturn(dto);

        mockMvc.perform(post("/api/admin/hero-category-relations").contentType(MediaType.APPLICATION_JSON)
                        .content(MATCHUP_BODY))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/api/admin/hero-category-relations/2").contentType(MediaType.APPLICATION_JSON)
                        .content(MATCHUP_BODY))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/admin/hero-category-relations/2")).andExpect(status().isNoContent());

        verify(categoryService).deleteMatchup(2L);
    }
}
