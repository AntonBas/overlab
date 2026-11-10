package gg.overlab.backend.media;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class WebpConverterTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4, 5, 6};

    @TempDir
    Path directory;

    private String script(String webpContent) throws IOException {
        Path file = directory.resolve("fake-cwebp");
        Files.writeString(file, """
                #!/bin/sh
                if [ "$1" = "-version" ]; then echo 1.0; exit 0; fi
                while [ $# -gt 0 ]; do
                  if [ "$1" = "-o" ]; then out="$2"; fi
                  shift
                done
                printf '%s' '""" + webpContent + "' > \"$out\"\n");
        file.toFile().setExecutable(true);
        return file.toString();
    }

    @Test
    void returnsTheConvertedImageWhenItIsSmaller() throws IOException {
        WebpConverter converter = new WebpConverter(script("WEBP"));

        assertThat(converter.fromPng(PNG)).hasValue("WEBP".getBytes());
    }

    @Test
    void keepsTheOriginalWhenTheConversionIsNotSmaller() throws IOException {
        WebpConverter converter = new WebpConverter(script("A-WEBP-LARGER-THAN-THE-PNG"));

        assertThat(converter.fromPng(PNG)).isEmpty();
    }

    @Test
    void reportsAvailabilityOfTheCommand() throws IOException {
        assertThat(new WebpConverter(script("WEBP")).isAvailable()).isTrue();
        assertThat(new WebpConverter("definitely-not-installed-cwebp").isAvailable()).isFalse();
    }

    @Test
    void returnsNothingWhenTheCommandIsMissing() {
        assertThat(new WebpConverter("definitely-not-installed-cwebp").fromPng(PNG)).isEmpty();
    }
}
