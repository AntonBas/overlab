package gg.overlab.backend.collector.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaStorage;
import gg.overlab.backend.media.WebpConverter;
import java.util.Optional;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HeroPortraitDownloaderTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4};
    private static final String SOURCE = "https://cdn.example/ana.png";

    @TempDir
    Path directory;

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    private MediaStorage storage() {
        return new MediaStorage(new MediaProperties(directory, "/media"));
    }

    private final WebpConverter webpConverter = mock(WebpConverter.class);

    private HeroPortraitDownloader downloader(MediaStorage storage) {
        return new HeroPortraitDownloader(new ImageDownloader(builder, "test-agent"), storage, webpConverter, true);
    }

    private Hero hero(String portraitUrl) {
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setPortraitUrl(portraitUrl);
        return hero;
    }

    @Test
    void downloadsAPortraitIntoTheHeroFolder() throws Exception {
        when(webpConverter.fromPng(any())).thenReturn(Optional.empty());
        server.expect(requestTo(SOURCE)).andRespond(withSuccess(PNG, MediaType.IMAGE_PNG));
        Hero hero = hero(null);

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.png");
        assertThat(Files.readAllBytes(directory.resolve("heroes/ana.png"))).isEqualTo(PNG);
        server.verify();
    }

    @Test
    void storesTheWebpVersionWhenTheConversionSucceeds() throws Exception {
        byte[] webp = {'W', 'E', 'B', 'P'};
        when(webpConverter.fromPng(any())).thenReturn(Optional.of(webp));
        server.expect(requestTo(SOURCE)).andRespond(withSuccess(PNG, MediaType.IMAGE_PNG));
        Hero hero = hero(null);

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.webp");
        assertThat(Files.readAllBytes(directory.resolve("heroes/ana.webp"))).isEqualTo(webp);
        assertThat(Files.exists(directory.resolve("heroes/ana.png"))).isFalse();
    }

    @Test
    void doesNothingWhileDownloadsAreDisabled() {
        Hero hero = hero(null);

        new HeroPortraitDownloader(new ImageDownloader(builder, "test-agent"), storage(), webpConverter, false).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isNull();
        server.verify();
    }

    @Test
    void skipsContentThatIsNotAPng() {
        server.expect(requestTo(SOURCE)).andRespond(withSuccess("<html>".getBytes(), MediaType.TEXT_HTML));
        Hero hero = hero(null);

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isNull();
    }

    @Test
    void survivesADownloadFailure() {
        server.expect(requestTo(SOURCE)).andRespond(withServerError());
        Hero hero = hero(null);

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isNull();
    }

    @Test
    void doesNotDownloadOverPlainHttpOrWithoutASource() {
        Hero hero = hero(null);
        HeroPortraitDownloader downloader = downloader(storage());

        downloader.ensurePortrait(hero, "http://cdn.example/ana.png");
        downloader.ensurePortrait(hero, null);

        assertThat(hero.getPortraitUrl()).isNull();
        server.verify();
    }

    @Test
    void keepsAPortraitThatIsAlreadyStored() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.HEROES, "ana.png", PNG);
        Hero hero = hero("heroes/ana.png");

        downloader(storage).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.png");
        server.verify();
    }

    @Test
    void downloadsAgainWhenTheStoredFileIsMissing() {
        server.expect(requestTo(SOURCE)).andRespond(withSuccess(PNG, MediaType.IMAGE_PNG));
        Hero hero = hero("heroes/ana.png");

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(Files.exists(directory.resolve("heroes/ana.png"))).isTrue();
        server.verify();
    }

    @Test
    void keepsAnAbsoluteUrlSetByAnAdministrator() {
        Hero hero = hero("https://cdn.example/custom.png");

        downloader(storage()).ensurePortrait(hero, SOURCE);

        assertThat(hero.getPortraitUrl()).isEqualTo("https://cdn.example/custom.png");
        server.verify();
    }
}
