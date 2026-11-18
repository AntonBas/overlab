package gg.overlab.backend.seo;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SeoPreviewControllerTest {

    private SeoPreviewService previewService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        previewService = mock(SeoPreviewService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new SeoPreviewController(previewService)).build();
    }

    @Test
    void existingPageAnswersNoContent() throws Exception {
        when(previewService.renderPreview("/heroes/ana")).thenReturn("<html></html>");

        mockMvc.perform(get("/api/seo/exists").param("path", "/heroes/ana")).andExpect(status().isNoContent());
    }

    @Test
    void unknownPageAnswersNotFound() throws Exception {
        when(previewService.renderPreview("/heroes/nobody")).thenReturn(null);

        mockMvc.perform(get("/api/seo/exists").param("path", "/heroes/nobody")).andExpect(status().isNotFound());
    }

    @Test
    void tooLongPathAnswersNotFound() throws Exception {
        mockMvc.perform(get("/api/seo/exists").param("path", "/heroes/" + "a".repeat(300)))
                .andExpect(status().isNotFound());
    }
}
