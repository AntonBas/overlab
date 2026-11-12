package gg.overlab.backend.config.security;

public final class PublicApiPaths {

    public static final String ADMIN_PREFIX = "/api/admin/";

    public static final String PERSONAL_PREFIX = "/api/me";

    private static final String API_PREFIX = "/api/";

    private PublicApiPaths() {
    }

    public static boolean isPublicRead(String method, String path) {
        return "GET".equals(method)
                && path.startsWith(API_PREFIX)
                && !path.startsWith(ADMIN_PREFIX)
                && !path.startsWith("/api/auth/")
                && !path.startsWith(PERSONAL_PREFIX);
    }
}
