package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PublicApiPathsTest {

    @Test
    void personalPathsAreTheMeEndpointAndItsChildrenOnly() {
        assertThat(PublicApiPaths.isPersonal("/api/me")).isTrue();
        assertThat(PublicApiPaths.isPersonal("/api/me/favorites")).isTrue();
        assertThat(PublicApiPaths.isPersonal("/api/media")).isFalse();
    }

    @Test
    void publicReadsExcludePersonalAdminAndAuthPaths() {
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/heroes")).isTrue();
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/media")).isTrue();
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/me/export")).isFalse();
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/admin/users")).isFalse();
        assertThat(PublicApiPaths.isPublicRead("POST", "/api/heroes")).isFalse();
    }
}
