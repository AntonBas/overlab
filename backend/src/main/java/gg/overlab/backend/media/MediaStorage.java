package gg.overlab.backend.media;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MediaStorage {

    private static final Pattern FILE_NAME = Pattern.compile("^[a-z0-9][a-z0-9-]*\\.(png|jpg|webp|svg)$");

    private final Path root;

    public MediaStorage(MediaProperties properties) {
        this.root = properties.directory().toAbsolutePath().normalize();
    }

    public String save(MediaFolder folder, String fileName, byte[] content) {
        Path target = resolve(folder, fileName);
        Path temporary = null;
        try {
            Files.createDirectories(target.getParent());
            temporary = Files.createTempFile(target.getParent(), "upload-", ".tmp");
            Files.write(temporary, content);
            Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException exception) {
            deleteQuietly(temporary);
            throw new UncheckedIOException(exception);
        }
        return relativePath(folder, fileName);
    }

    public boolean exists(String relativePath) {
        Path target = root.resolve(relativePath).normalize();
        return target.startsWith(root) && Files.isRegularFile(target);
    }

    public Optional<byte[]> read(String relativePath) {
        Path target = root.resolve(relativePath).normalize();
        if (!target.startsWith(root) || !Files.isRegularFile(target)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(target));
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    public void delete(String relativePath) {
        Path target = root.resolve(relativePath).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Path is outside the media directory");
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private void deleteQuietly(Path file) {
        if (file == null) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            log.warn("Could not remove the temporary file {}: {}", file, exception.getMessage());
        }
    }

    private Path resolve(MediaFolder folder, String fileName) {
        if (!FILE_NAME.matcher(fileName).matches()) {
            throw new IllegalArgumentException("Invalid media file name: " + fileName);
        }
        return root.resolve(folder.directoryName()).resolve(fileName);
    }

    private String relativePath(MediaFolder folder, String fileName) {
        return folder.directoryName() + "/" + fileName;
    }
}
