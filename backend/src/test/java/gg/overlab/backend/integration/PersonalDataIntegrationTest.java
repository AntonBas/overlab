package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.personal.PersonalService;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class PersonalDataIntegrationTest {

    private static final String PREFIX = "personal-test-";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private GameMapRepository mapRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;
    private Cookie ownerCookie;
    private Cookie otherCookie;
    private final List<Hero> heroes = new ArrayList<>();
    private GameMap map;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        cleanUp();
        ownerCookie = cookieFor(saveUser("owner"));
        otherCookie = cookieFor(saveUser("other"));
        for (int index = 0; index <= PersonalService.MAX_NOTES_PER_USER; index++) {
            heroes.add(saveHero(index));
        }
        map = new GameMap();
        map.setSlug(PREFIX + "map");
        map.setName("Personal Test Map");
        map = mapRepository.saveAndFlush(map);
    }

    @AfterEach
    void cleanUp() {
        userRepository.findByEmailIgnoreCase(PREFIX + "owner@overlab.test").ifPresent(userRepository::delete);
        userRepository.findByEmailIgnoreCase(PREFIX + "other@overlab.test").ifPresent(userRepository::delete);
        heroRepository.findAll().stream().filter(hero -> hero.getSlug().startsWith(PREFIX))
                .forEach(heroRepository::delete);
        mapRepository.findBySlug(PREFIX + "map").ifPresent(mapRepository::delete);
        heroes.clear();
    }

    @Test
    void favoritesAreIdempotentAndPrivate() throws Exception {
        String slug = heroes.get(0).getSlug();
        mockMvc.perform(put("/api/me/favorites/heroes/" + slug).cookie(ownerCookie)).andExpect(status().isNoContent());
        mockMvc.perform(put("/api/me/favorites/heroes/" + slug).cookie(ownerCookie)).andExpect(status().isNoContent());
        mockMvc.perform(put("/api/me/favorites/maps/" + map.getSlug()).cookie(ownerCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/me/favorites").cookie(ownerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heroes.length()").value(1))
                .andExpect(jsonPath("$.maps.length()").value(1));
        mockMvc.perform(get("/api/me/favorites").cookie(otherCookie))
                .andExpect(jsonPath("$.heroes.length()").value(0));

        mockMvc.perform(delete("/api/me/favorites/heroes/" + slug).cookie(ownerCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/me/favorites").cookie(ownerCookie))
                .andExpect(jsonPath("$.heroes.length()").value(0));
    }

    @Test
    void unknownHeroOrMapIsNotFound() throws Exception {
        mockMvc.perform(put("/api/me/favorites/heroes/missing-hero").cookie(ownerCookie))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/me/favorites/maps/missing-map").cookie(ownerCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void notesBelongToTheirOwnerOnly() throws Exception {
        String slug = heroes.get(0).getSlug();
        mockMvc.perform(json(put("/api/me/notes/" + slug), "{\"content\":\"  push the high ground  \"}")
                        .cookie(ownerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("push the high ground"));

        mockMvc.perform(get("/api/me/notes/" + slug).cookie(ownerCookie)).andExpect(status().isOk());
        mockMvc.perform(get("/api/me/notes/" + slug).cookie(otherCookie)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/me/notes").cookie(otherCookie)).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/me/notes")).andExpect(status().isUnauthorized());
    }

    @Test
    void savingAnEmptyNoteRemovesIt() throws Exception {
        String slug = heroes.get(0).getSlug();
        mockMvc.perform(json(put("/api/me/notes/" + slug), "{\"content\":\"keep\"}").cookie(ownerCookie))
                .andExpect(status().isOk());
        mockMvc.perform(json(put("/api/me/notes/" + slug), "{\"content\":\"   \"}").cookie(ownerCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/me/notes").cookie(ownerCookie)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void noteLengthAndCountAreLimited() throws Exception {
        String tooLong = "x".repeat(2001);
        mockMvc.perform(json(put("/api/me/notes/" + heroes.get(0).getSlug()), "{\"content\":\"" + tooLong + "\"}")
                        .cookie(ownerCookie))
                .andExpect(status().isBadRequest());

        for (int index = 0; index < PersonalService.MAX_NOTES_PER_USER; index++) {
            mockMvc.perform(json(put("/api/me/notes/" + heroes.get(index).getSlug()), "{\"content\":\"note\"}")
                            .cookie(ownerCookie))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(json(put("/api/me/notes/" + heroes.get(PersonalService.MAX_NOTES_PER_USER).getSlug()),
                        "{\"content\":\"one too many\"}").cookie(ownerCookie))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(put("/api/me/notes/" + heroes.get(0).getSlug()), "{\"content\":\"edited\"}")
                        .cookie(ownerCookie))
                .andExpect(status().isOk());
    }

    @Test
    void preferencesRoundTripAndStayPrivate() throws Exception {
        mockMvc.perform(get("/api/me/preferences").cookie(ownerCookie))
                .andExpect(jsonPath("$.queue").doesNotExist());

        mockMvc.perform(json(put("/api/me/preferences"),
                        "{\"queue\":\"COMPETITIVE\",\"platform\":\"PC\",\"region\":\"EUROPE\",\"tier\":\"GOLD\"}")
                        .cookie(ownerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tier").value("GOLD"));

        mockMvc.perform(get("/api/me/preferences").cookie(otherCookie)).andExpect(jsonPath("$.tier").doesNotExist());
        mockMvc.perform(json(put("/api/me/preferences"), "{\"queue\":\"NOPE\"}").cookie(ownerCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletingTheAccountRemovesPersonalData() throws Exception {
        String slug = heroes.get(0).getSlug();
        mockMvc.perform(put("/api/me/favorites/heroes/" + slug).cookie(ownerCookie)).andExpect(status().isNoContent());
        mockMvc.perform(json(put("/api/me/notes/" + slug), "{\"content\":\"gone soon\"}").cookie(ownerCookie))
                .andExpect(status().isOk());
        User owner = userRepository.findByEmailIgnoreCase(PREFIX + "owner@overlab.test").orElseThrow();

        userRepository.delete(owner);
        userRepository.flush();

        assertThat(userRepository.existsById(owner.getId())).isFalse();
    }

    private User saveUser(String name) {
        User user = new User();
        user.setEmail(PREFIX + name + "@overlab.test");
        user.setDisplayName("Personal " + name);
        user.setEmailVerified(true);
        return userRepository.saveAndFlush(user);
    }

    private Hero saveHero(int index) {
        Hero hero = new Hero();
        hero.setSlug(PREFIX + index);
        hero.setName("Personal Hero " + index);
        hero.setRole(HeroRole.DAMAGE);
        return heroRepository.saveAndFlush(hero);
    }

    private Cookie cookieFor(User user) {
        return new Cookie("access_token", tokenProvider.createAccessToken(user));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
