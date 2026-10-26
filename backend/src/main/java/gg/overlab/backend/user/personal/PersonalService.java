package gg.overlab.backend.user.personal;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.gamemap.MapMapper;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroMapper;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.NoteDto;
import gg.overlab.backend.user.personal.dto.PreferencesDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PersonalService {

    public static final int MAX_NOTES_PER_USER = 50;
    public static final int MAX_FAVORITES_PER_KIND = 200;

    private final UserFavoriteRepository favoriteRepository;
    private final UserNoteRepository noteRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final HeroRepository heroRepository;
    private final GameMapRepository mapRepository;
    private final HeroMapper heroMapper;
    private final MapMapper mapMapper;

    @Transactional(readOnly = true)
    public FavoritesDto favorites(Long userId) {
        return new FavoritesDto(
                favoriteRepository.findHeroFavorites(userId).stream()
                        .map(favorite -> heroMapper.toDto(favorite.getHero())).toList(),
                favoriteRepository.findMapFavorites(userId).stream()
                        .map(favorite -> mapMapper.toDto(favorite.getMap())).toList());
    }

    @Transactional
    public void addHeroFavorite(Long userId, String heroSlug) {
        Hero hero = findHero(heroSlug);
        if (favoriteRepository.existsByUserIdAndHeroSlug(userId, heroSlug)) {
            return;
        }
        if (favoriteRepository.findHeroFavorites(userId).size() >= MAX_FAVORITES_PER_KIND) {
            throw new BadRequestException("You can keep at most " + MAX_FAVORITES_PER_KIND + " favorite heroes");
        }
        UserFavorite favorite = new UserFavorite();
        favorite.setUserId(userId);
        favorite.setHero(hero);
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeHeroFavorite(Long userId, String heroSlug) {
        favoriteRepository.deleteByUserIdAndHeroSlug(userId, heroSlug);
    }

    @Transactional
    public void addMapFavorite(Long userId, String mapSlug) {
        GameMap map = mapRepository.findBySlug(mapSlug)
                .orElseThrow(() -> new EntityNotFoundException("Map", mapSlug));
        if (favoriteRepository.existsByUserIdAndMapSlug(userId, mapSlug)) {
            return;
        }
        if (favoriteRepository.findMapFavorites(userId).size() >= MAX_FAVORITES_PER_KIND) {
            throw new BadRequestException("You can keep at most " + MAX_FAVORITES_PER_KIND + " favorite maps");
        }
        UserFavorite favorite = new UserFavorite();
        favorite.setUserId(userId);
        favorite.setMap(map);
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeMapFavorite(Long userId, String mapSlug) {
        favoriteRepository.deleteByUserIdAndMapSlug(userId, mapSlug);
    }

    @Transactional(readOnly = true)
    public List<NoteDto> notes(Long userId) {
        return noteRepository.findAllForUser(userId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public NoteDto note(Long userId, String heroSlug) {
        return noteRepository.findForUserAndHero(userId, heroSlug).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Note", heroSlug));
    }

    @Transactional
    public NoteDto saveNote(Long userId, String heroSlug, String content) {
        Hero hero = findHero(heroSlug);
        String trimmed = content.trim();
        UserNote note = noteRepository.findForUserAndHero(userId, heroSlug).orElse(null);
        if (trimmed.isEmpty()) {
            deleteNote(userId, heroSlug);
            return new NoteDto(hero.getSlug(), hero.getName(), "", null);
        }
        if (note == null) {
            if (noteRepository.countByUserId(userId) >= MAX_NOTES_PER_USER) {
                throw new BadRequestException("You can keep at most " + MAX_NOTES_PER_USER + " notes");
            }
            note = new UserNote();
            note.setUserId(userId);
            note.setHero(hero);
        }
        note.setContent(trimmed);
        return toDto(noteRepository.saveAndFlush(note));
    }

    @Transactional
    public void deleteNote(Long userId, String heroSlug) {
        noteRepository.deleteByUserIdAndHeroSlug(userId, heroSlug);
    }

    @Transactional(readOnly = true)
    public PreferencesDto preferences(Long userId) {
        return preferenceRepository.findById(userId).map(this::toDto)
                .orElseGet(() -> new PreferencesDto(null, null, null, null));
    }

    @Transactional
    public PreferencesDto savePreferences(Long userId, PreferencesDto request) {
        UserPreference preference = preferenceRepository.findById(userId).orElseGet(() -> {
            UserPreference created = new UserPreference();
            created.setUserId(userId);
            return created;
        });
        preference.setQueue(request.queue());
        preference.setPlatform(request.platform());
        preference.setRegion(request.region());
        preference.setTier(request.tier());
        return toDto(preferenceRepository.save(preference));
    }

    private Hero findHero(String heroSlug) {
        return heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
    }

    private NoteDto toDto(UserNote note) {
        return new NoteDto(note.getHero().getSlug(), note.getHero().getName(), note.getContent(),
                note.getUpdatedAt());
    }

    private PreferencesDto toDto(UserPreference preference) {
        return new PreferencesDto(preference.getQueue(), preference.getPlatform(), preference.getRegion(),
                preference.getTier());
    }
}
