package gg.overlab.backend.collector;

import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaStorage;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RoleIconDownloader {

    private final ImageDownloader imageDownloader;
    private final MediaStorage mediaStorage;
    private final boolean enabled;

    @Autowired
    public RoleIconDownloader(CollectorProperties properties, ImageDownloader imageDownloader,
                              MediaStorage mediaStorage) {
        this(imageDownloader, mediaStorage, properties.downloadPortraits());
    }

    RoleIconDownloader(ImageDownloader imageDownloader, MediaStorage mediaStorage, boolean enabled) {
        this.imageDownloader = imageDownloader;
        this.mediaStorage = mediaStorage;
        this.enabled = enabled;
    }

    public void ensureRoleIcon(String role, String sourceUrl) {
        if (!enabled || role == null) {
            return;
        }
        String fileName = role.toLowerCase(Locale.ROOT) + ".svg";
        if (mediaStorage.exists(MediaFolder.ROLES.directoryName() + "/" + fileName)) {
            return;
        }
        imageDownloader.downloadSvg(sourceUrl)
                .ifPresent(content -> mediaStorage.save(MediaFolder.ROLES, fileName, content));
    }
}
