package gg.overlab.backend.media;

public enum MediaFolder {
    ABILITIES("abilities"),
    HEROES("heroes"),
    MAPS("maps"),
    PERKS("perks"),
    ROLES("roles");

    private final String directoryName;

    MediaFolder(String directoryName) {
        this.directoryName = directoryName;
    }

    public String directoryName() {
        return directoryName;
    }
}
