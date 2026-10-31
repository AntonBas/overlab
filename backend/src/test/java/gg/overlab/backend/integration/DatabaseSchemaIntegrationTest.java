package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

@IntegrationTest
class DatabaseSchemaIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void everyMigrationIsAppliedSuccessfullyInOrder() {
        List<String> versions = jdbcTemplate.queryForList(
                "select version from flyway_schema_history where success order by installed_rank", String.class);

        assertThat(versions).containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16");
    }

    @Test
    void snapshotsRememberTheirSource() {
        String defaultValue = jdbcTemplate.queryForObject(
                "select column_default from information_schema.columns "
                        + "where table_name = 'hero_stats' and column_name = 'source'", String.class);

        assertThat(defaultValue).contains("COLLECTOR");
    }

    @Test
    void allTablesExist() {
        List<String> tables = jdbcTemplate.queryForList(
                "select table_name from information_schema.tables where table_schema = 'public'", String.class);

        assertThat(tables).contains("heroes", "maps", "patches", "perks", "hero_abilities", "hero_relations", "guides", "hero_stats",
                "users", "user_tokens", "audit_log", "collector_runs");
    }

    @Test
    void mapsAreSeeded() {
        Integer maps = jdbcTemplate.queryForObject("select count(*) from maps", Integer.class);

        assertThat(maps).isEqualTo(31);
    }

    @Test
    void uniquenessRulesExistInTheDatabase() {
        List<String> indexes = jdbcTemplate.queryForList(
                "select indexname from pg_indexes where schemaname = 'public'", String.class);
        List<String> constraints = jdbcTemplate.queryForList(
                "select conname from pg_constraint where connamespace = 'public'::regnamespace", String.class);

        assertThat(indexes).contains("uq_guides_slug", "uq_patches_slug", "idx_hero_stats_filters");
        assertThat(constraints).contains("uq_hero_stats_snapshot", "uq_perks_hero_name", "uq_hero_relations",
                "ck_hero_relations_distinct", "uq_users_provider");
    }
}
