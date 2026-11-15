package gg.overlab.backend.media;

import gg.overlab.backend.common.Sha256;
import gg.overlab.backend.exception.core.BadRequestException;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class ImageStore {

    public static final long MAX_BYTES = 2L * 1024 * 1024;

    private static final int HASH_LENGTH = 8;

    private final MediaStorage mediaStorage;

    public String replace(MediaFolder folder, String baseName, String previousPath, MultipartFile file) {
        return replace(folder, baseName, previousPath, read(file));
    }

    public String replace(MediaFolder folder, String baseName, String previousPath, byte[] content) {
        String extension = detectExtension(content);
        String fileName = baseName + "-" + shortHash(content) + "." + extension;
        String path = mediaStorage.save(folder, fileName, content);
        if (previousPath != null && !previousPath.equals(path)) {
            remove(previousPath);
        }
        return path;
    }

    public void remove(String path) {
        if (path == null || path.startsWith("http") || path.startsWith("/")) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mediaStorage.delete(path);
                }
            });
            return;
        }
        mediaStorage.delete(path);
    }

    private byte[] read(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Choose an image file");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("The image must not exceed " + MAX_BYTES / (1024 * 1024) + " MB");
        }
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new BadRequestException("The image could not be read");
        }
    }

    private String detectExtension(byte[] content) {
        if (startsWith(content, 0x89, 'P', 'N', 'G')) {
            return "png";
        }
        if (startsWith(content, 0xFF, 0xD8, 0xFF)) {
            return "jpg";
        }
        if (content.length > 12 && startsWith(content, 'R', 'I', 'F', 'F')
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') {
            return "webp";
        }
        throw new BadRequestException("Only PNG, JPEG and WebP images are accepted");
    }

    private boolean startsWith(byte[] content, int... signature) {
        if (content.length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if ((content[index] & 0xFF) != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private String shortHash(byte[] content) {
        return Sha256.hex(content).substring(0, HASH_LENGTH);
    }
}
