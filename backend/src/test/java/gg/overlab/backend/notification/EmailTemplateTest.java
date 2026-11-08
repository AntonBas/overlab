package gg.overlab.backend.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class EmailTemplateTest {

    @Test
    void htmlEscapesUserProvidedText() {
        EmailTemplate template = new EmailTemplate("Subject", "Hi <b>Eve</b>,", List.of("a & b\nsecond line"),
                "Open", "https://overlab.gg/x?a=1&b=2", "Footnote");

        String html = template.html("https://overlabgg.com/email-logo.png");

        assertThat(html).contains("src=\"https://overlabgg.com/email-logo.png\"")
                .contains("Hi &lt;b&gt;Eve&lt;/b&gt;,").contains("a &amp; b<br>second line")
                .contains("href=\"https://overlab.gg/x?a=1&amp;b=2\"").doesNotContain("<b>Eve</b>");
    }

    @Test
    void plainTextKeepsTheLinkAndOmitsItWhenThereIsNone() {
        EmailTemplate withLink = new EmailTemplate("S", "Hi,", List.of("Body"), "Open", "https://overlab.gg/a", "End");
        EmailTemplate withoutLink = new EmailTemplate("S", "Hi,", List.of("Body"), null, null, "End");

        assertThat(withLink.plainText()).contains("Open:\nhttps://overlab.gg/a").endsWith("End");
        assertThat(withoutLink.plainText()).isEqualTo("Hi,\n\nBody\n\nEnd");
        assertThat(withoutLink.html("https://overlabgg.com/email-logo.png")).doesNotContain("<a href");
    }
}
