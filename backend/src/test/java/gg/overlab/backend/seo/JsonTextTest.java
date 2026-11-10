package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JsonTextTest {

    @Test
    void escapesQuotesBackslashesAndScriptBreakingCharacters() {
        assertThat(JsonText.quote("a\"b\\c</script>\n")).isEqualTo("\"a\\\"b\\\\c\\u003c/script\\u003e\\n\"");
    }
}
