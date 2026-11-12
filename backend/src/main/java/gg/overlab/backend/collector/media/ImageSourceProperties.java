package gg.overlab.backend.collector.media;

import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "collector.images")
public record ImageSourceProperties(@DefaultValue List<String> allowedHosts) {

    public boolean allows(String host) {
        if (allowedHosts.isEmpty()) {
            return true;
        }
        String lowerCaseHost = host.toLowerCase(Locale.ROOT);
        return allowedHosts.stream()
                .map(allowed -> allowed.toLowerCase(Locale.ROOT))
                .anyMatch(allowed -> lowerCaseHost.equals(allowed) || lowerCaseHost.endsWith("." + allowed));
    }
}
