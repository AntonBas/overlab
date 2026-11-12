package gg.overlab.backend.guide;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GuidePath {

    private static final Pattern PATH = Pattern.compile("^(\\d{1,18})(?:-.*)?$");

    private GuidePath() {
    }

    public static Optional<Long> parseId(String path) {
        if (path == null) {
            return Optional.empty();
        }
        Matcher matcher = PATH.matcher(path);
        return matcher.matches() ? Optional.of(Long.valueOf(matcher.group(1))) : Optional.empty();
    }

    public static Long idOf(String path) {
        return parseId(path).orElseThrow(() -> new EntityNotFoundException("Guide", path));
    }

    public static String of(Long id, String slug) {
        return id + "-" + slug;
    }
}
