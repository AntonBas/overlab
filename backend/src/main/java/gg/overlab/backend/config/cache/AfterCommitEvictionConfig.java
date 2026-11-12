package gg.overlab.backend.config.cache;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AfterCommitEvictionConfig {

    @Bean
    public static BeanPostProcessor afterCommitEvictionPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof CacheManager manager && !(bean instanceof AfterCommitEvictionCacheManager)) {
                    return new AfterCommitEvictionCacheManager(manager);
                }
                return bean;
            }
        };
    }
}
