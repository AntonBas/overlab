package gg.overlab.backend.config.cache;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    private final ObjectProvider<MeterRegistry> meterRegistry;

    public CacheConfig(ObjectProvider<MeterRegistry> meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new FallbackCacheErrorHandler(meterRegistry::getIfAvailable);
    }
}
