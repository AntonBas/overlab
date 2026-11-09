package gg.overlab.backend.audit;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.audit")
public record AuditProperties(@DefaultValue("90d") Duration userEventRetention) {
}
