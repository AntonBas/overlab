package gg.overlab.backend.collector;

import java.util.LinkedHashSet;
import java.util.Set;

final class RunErrors {

    private static final int MAX_SUMMARY_LENGTH = 1000;
    private static final int MAX_DISTINCT_ERRORS = 3;

    private final Set<String> errors = new LinkedHashSet<>();

    static String truncate(String text) {
        return text.length() > MAX_SUMMARY_LENGTH ? text.substring(0, MAX_SUMMARY_LENGTH) : text;
    }

    void add(SnapshotRequest request, RuntimeException exception) {
        if (errors.size() < MAX_DISTINCT_ERRORS) {
            errors.add(request.describe(exception));
        }
    }

    String summary() {
        return errors.isEmpty() ? null : truncate(String.join("; ", errors));
    }
}
