package gg.overlab.backend.config.security;

public final class PublicApiPaths {

    public static final String ADMIN_PREFIX = "/api/admin/";

    public static final String PERSONAL_PREFIX = "/api/me";

    private static final String PERSONAL_PATH_PREFIX = "/api/me/";

    private static final String API_PREFIX = "/api/";

    private PublicApiPaths() {
    }

    public static boolean isPublicRead(String method, String path) {
        return "GET".equals(method)
                && path.startsWith(API_PREFIX)
                && !path.startsWith(ADMIN_PREFIX)
                && !path.startsWith("/api/auth/")
                && !isPersonal(path);
    }

    public static boolean isPersonal(String path) {
        return PERSONAL_PREFIX.equals(path) || path.startsWith(PERSONAL_PATH_PREFIX);
    }
}
