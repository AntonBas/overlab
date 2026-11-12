package gg.overlab.backend.media;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WebpConverter {

    private static final String QUALITY = "85";
    private static final String ALPHA_QUALITY = "90";
    private static final String EFFORT = "6";

    private final String command;
    private final Duration timeout;

    public WebpConverter(@Value("${app.media.webp-command:cwebp}") String command,
                         @Value("${app.media.webp-timeout:20s}") Duration timeout) {
        this.command = command;
        this.timeout = timeout;
    }

    public boolean isAvailable() {
        try {
            Process process = silentProcess(List.of(command, "-version"));
            if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (IOException exception) {
            return false;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public Optional<byte[]> fromPng(byte[] png) {
        Path source = null;
        Path target = null;
        try {
            source = Files.createTempFile("portrait-", ".png");
            target = Files.createTempFile("portrait-", ".webp");
            Files.write(source, png);
            List<String> arguments = List.of(command, "-quiet", "-q", QUALITY, "-alpha_q", ALPHA_QUALITY,
                    "-m", EFFORT, source.toString(), "-o", target.toString());
            Process process = silentProcess(arguments);
            if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
                process.destroyForcibly();
                log.warn("{} did not finish within {}", command, timeout);
                return Optional.empty();
            }
            if (process.exitValue() != 0) {
                log.warn("{} failed with exit code {}", command, process.exitValue());
                return Optional.empty();
            }
            byte[] webp = Files.readAllBytes(target);
            return webp.length > 0 && webp.length < png.length ? Optional.of(webp) : Optional.empty();
        } catch (IOException exception) {
            log.debug("WebP conversion is unavailable: {}", exception.getMessage());
            return Optional.empty();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } finally {
            deleteQuietly(source);
            deleteQuietly(target);
        }
    }

    private Process silentProcess(List<String> arguments) throws IOException {
        return new ProcessBuilder(arguments)
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                .start();
    }

    private void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException exception) {
            log.debug("Could not delete {}", path);
        }
    }
}
