package gg.overlab.backend.collector.media;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SvgValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
        "<svg width=\"42\" height=\"42\"><path d=\"M0 0h4v4z\"/></svg>",
        "<?xml version=\"1.0\"?><svg xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#fff\"><circle r=\"2\"/></g></svg>",
        "<svg><defs><linearGradient id=\"a\"><stop offset=\"0\"/></linearGradient></defs><rect fill=\"url(#a)\"/></svg>",
        "<svg><style>.a{fill:url(#b)}</style><path class=\"a\"/></svg>"})
    void acceptsPlainShapes(String svg) {
        assertThat(SvgValidator.isSafe(svg)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "<svg><script>alert(1)</script></svg>",
        "<svg onload=\"alert(1)\"></svg>",
        "<svg><a href=\"javascript:alert(1)\"><path/></a></svg>",
        "<svg><foreignObject/></svg>",
        "<svg><use href=\"https://evil.example/x.svg#a\"/></svg>",
        "<svg><image href=\"https://evil.example/x.png\"/></svg>",
        "<svg><path style=\"fill:url(https://evil.example/x)\"/></svg>",
        "<svg><style>@import url(https://evil.example/x.css);</style></svg>",
        "<svg><path fill=\"javascript:alert(1)\"/></svg>",
        "<!DOCTYPE svg [<!ENTITY x \"y\">]><svg><path/></svg>",
        "<svg><animate attributeName=\"href\" values=\"javascript:alert(1)\"/></svg>",
        "<html><body>not an svg</body></html>",
        ""})
    void rejectsAnythingThatCouldExecuteOrLoadExternalContent(String svg) {
        assertThat(SvgValidator.isSafe(svg)).isFalse();
    }
}
