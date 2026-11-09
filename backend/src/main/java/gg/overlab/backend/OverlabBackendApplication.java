package gg.overlab.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class OverlabBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(OverlabBackendApplication.class, args);
    }

}
