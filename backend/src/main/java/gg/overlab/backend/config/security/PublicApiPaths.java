package gg.overlab.backend.config.security;

public final class PublicApiPaths {

    private static final String API_PREFIX = "/api/";

    private PublicApiPaths() {
    }

    public static boolean isPublicRead(String method, String path) {
        return "GET".equals(method)
                && path.startsWith(API_PREFIX)
                && !path.startsWith("/api/admin/")
                && !path.startsWith("/api/auth/")
                && !path.startsWith("/api/me");
    }
}
