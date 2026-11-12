package gg.overlab.backend.collector.media;

import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "collector.images")
public record ImageSourceProperties(@DefaultValue List<String> allowedHosts) {

    public static final String ANY_HOST = "*";

    public static ImageSourceProperties unrestricted() {
        return new ImageSourceProperties(List.of(ANY_HOST));
    }

    public boolean allows(String host) {
        if (allowedHosts.contains(ANY_HOST)) {
            return true;
        }
        String lowerCaseHost = host.toLowerCase(Locale.ROOT);
        return allowedHosts.stream()
                .map(allowed -> allowed.toLowerCase(Locale.ROOT))
                .anyMatch(allowed -> lowerCaseHost.equals(allowed) || lowerCaseHost.endsWith("." + allowed));
    }
}
