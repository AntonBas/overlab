package gg.overlab.backend.patch;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class PatchSeasons {

    private static final Pattern SEASON = Pattern.compile("(?i)\\bseason\\s+(\\d+)\\b");

    private PatchSeasons() {
    }

    static Integer fromTitle(String title) {
        if (title == null) {
            return null;
        }
        Matcher matcher = SEASON.matcher(title);
        return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
    }

    static Map<Long, Integer> resolve(List<Patch> patches) {
        Map<Long, Integer> seasons = new HashMap<>();
        Integer current = null;
        List<Patch> oldestFirst = patches.stream().sorted(Comparator.comparing(Patch::getReleasedAt)).toList();
        for (Patch patch : oldestFirst) {
            Integer announced = fromTitle(patch.getTitle());
            if (announced != null) {
                current = announced;
            }
            if (current != null) {
                seasons.put(patch.getId(), current);
            }
        }
        return seasons;
    }
}
