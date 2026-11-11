package gg.overlab.backend.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MediaStorageTest {

    @TempDir
    Path directory;

    private MediaStorage storage() {
        return new MediaStorage(new MediaProperties(directory, "/media"));
    }

    @Test
    void savesAFileInsideItsFolderAndReturnsTheRelativePath() throws Exception {
        String path = storage().save(MediaFolder.HEROES, "ana.png", new byte[] {1, 2, 3});

        assertThat(path).isEqualTo("heroes/ana.png");
        assertThat(Files.readAllBytes(directory.resolve("heroes/ana.png"))).containsExactly(1, 2, 3);
    }

    @Test
    void replacesAnExistingFileWithoutLeavingTemporaryFiles() throws Exception {
        MediaStorage storage = storage();
        storage.save(MediaFolder.MAPS, "busan.png", new byte[] {1});
        storage.save(MediaFolder.MAPS, "busan.png", new byte[] {2});

        assertThat(Files.readAllBytes(directory.resolve("maps/busan.png"))).containsExactly(2);
        try (var files = Files.list(directory.resolve("maps"))) {
            assertThat(files).hasSize(1);
        }
    }

    @Test
    void failedSaveLeavesNoTemporaryFileBehind() throws Exception {
        Path blockedTarget = directory.resolve("maps/busan.png");
        Files.createDirectories(blockedTarget);
        Files.writeString(blockedTarget.resolve("keep.txt"), "x");

        assertThatThrownBy(() -> storage().save(MediaFolder.MAPS, "busan.png", new byte[] {1}))
                .isInstanceOf(java.io.UncheckedIOException.class);

        try (var files = Files.list(directory.resolve("maps"))) {
            assertThat(files).extracting(path -> path.getFileName().toString()).containsExactly("busan.png");
        }
    }

    @Test
    void rejectsNamesThatCouldEscapeTheFolder() {
        MediaStorage storage = storage();

        assertThatThrownBy(() -> storage.save(MediaFolder.HEROES, "../x.png", new byte[] {1}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.save(MediaFolder.HEROES, "ana.exe", new byte[] {1}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void existsOnlyForFilesInsideTheMediaDirectory() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.PERKS, "shield.png", new byte[] {1});

        assertThat(storage.exists("perks/shield.png")).isTrue();
        assertThat(storage.exists("perks/missing.png")).isFalse();
        assertThat(storage.exists("../outside.png")).isFalse();
    }

    @Test
    void deletesAFile() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.PERKS, "shield.png", new byte[] {1});

        storage.delete("perks/shield.png");

        assertThat(storage.exists("perks/shield.png")).isFalse();
    }
}
