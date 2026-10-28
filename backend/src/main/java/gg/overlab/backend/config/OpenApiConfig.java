package gg.overlab.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI overlabOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Overlab API")
                .description("Hero statistics, curated counter-picks and synergies, guides and personal library. "
                        + "Statistics come from the scheduled collector; counter-picks and synergies are curated "
                        + "recommendations, not statistics. Unofficial fan site, not affiliated with Blizzard Entertainment.")
                .version("1"));
    }
}
