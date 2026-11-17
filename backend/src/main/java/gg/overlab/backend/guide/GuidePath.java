package gg.overlab.backend.guide;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GuidePath {

    private static final Pattern LEGACY_PATH = Pattern.compile("^(\\d{1,18})-.*$");

    private GuidePath() {
    }

    public static Optional<Long> legacyId(String path) {
        if (path == null) {
            return Optional.empty();
        }
        Matcher matcher = LEGACY_PATH.matcher(path);
        return matcher.matches() ? Optional.of(Long.valueOf(matcher.group(1))) : Optional.empty();
    }
}
