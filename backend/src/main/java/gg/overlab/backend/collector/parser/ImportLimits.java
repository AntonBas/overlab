package gg.overlab.backend.collector.parser;

import java.util.regex.Pattern;

final class ImportLimits {

    static final int MAX_SLUG_LENGTH = 64;
    static final int MAX_NAME_LENGTH = 128;
    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    private ImportLimits() {
    }

    static boolean isSlug(String value) {
        return value != null && value.length() <= MAX_SLUG_LENGTH && SLUG.matcher(value).matches();
    }

    static boolean isName(String value) {
        return value != null && !value.isBlank() && value.length() <= MAX_NAME_LENGTH;
    }

    static String truncate(String value, int maxLength) {
        return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
