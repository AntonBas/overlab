package gg.overlab.backend.config.cache;

import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.hero.HeroService;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.cache.annotation.CacheEvict;

@Documented
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@CacheEvict(cacheNames = {CacheNames.CONTENT, HeroService.CACHE_NAME, MapService.CACHE_NAME}, allEntries = true)
public @interface EvictContentCaches {
}
