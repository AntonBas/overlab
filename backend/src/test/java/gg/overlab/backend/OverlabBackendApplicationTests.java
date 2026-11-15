package gg.overlab.backend;

import gg.overlab.backend.integration.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.testcontainers.DockerClientFactory;

@IntegrationTest
@EnabledIf("dockerAvailable")
class OverlabBackendApplicationTests {

    static boolean dockerAvailable() {
        return DockerClientFactory.instance().isDockerAvailable();
    }

    @Test
    void contextLoads() {
    }

}
