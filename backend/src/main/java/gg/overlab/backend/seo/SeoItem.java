package gg.overlab.backend.seo;

public record SeoItem(String text, String path) {

    static SeoItem plain(String text) {
        return new SeoItem(text, null);
    }

    static SeoItem link(String text, String path) {
        return new SeoItem(text, path);
    }
}
