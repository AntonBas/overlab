package gg.overlab.backend.collector;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

@Component
public class PatchNotesParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MMMM d, uuuu", Locale.ENGLISH);
    private static final String BALANCE_SECTIONS = ".PatchNotes-section-hero_update, .PatchNotes-section-map_update";

    public List<ParsedPatch> parse(String html) {
        Document document = Jsoup.parse(html);
        Elements blocks = document.select(".PatchNotes-patch");
        if (blocks.isEmpty()) {
            throw new PatchNotesFormatException("No patch blocks found, the page markup may have changed");
        }
        List<ParsedPatch> patches = new ArrayList<>();
        for (Element block : blocks) {
            LocalDate date = dateOf(block);
            if (date != null && !block.select(BALANCE_SECTIONS).isEmpty()) {
                patches.add(new ParsedPatch(date, titleOf(block)));
            }
        }
        return List.copyOf(patches);
    }

    private LocalDate dateOf(Element block) {
        Element date = block.selectFirst(".PatchNotes-date");
        if (date == null) {
            return null;
        }
        try {
            return LocalDate.parse(date.text().trim(), DATE_FORMAT);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String titleOf(Element block) {
        List<String> sectionTitles = block.select(".PatchNotes-sectionTitle").stream()
                .map(Element::text)
                .map(String::trim)
                .filter(title -> !title.isEmpty())
                .toList();
        return sectionTitles.stream()
                .filter(title -> title.contains("Season"))
                .findFirst()
                .orElseGet(() -> sectionTitles.isEmpty() ? null : sectionTitles.get(0));
    }
}
