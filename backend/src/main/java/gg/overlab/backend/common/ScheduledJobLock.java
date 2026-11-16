package gg.overlab.backend.common;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.function.Supplier;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Keeps a scheduled job from running twice at once, for example while an old and a new instance overlap during a
 * deploy. The lock is a PostgreSQL session advisory lock on its own connection, so it is released when the job
 * ends or when the connection or the instance dies.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledJobLock {

    private final DataSource dataSource;

    /**
     * Runs the job unless another instance holds the lock for the same name.
     *
     * @return whether the job ran
     */
    public boolean runExclusively(String jobName, Runnable job) {
        return callExclusively(jobName, () -> {
            job.run();
            return Boolean.TRUE;
        }).isPresent();
    }

    /**
     * Calls the job unless another instance holds the lock for the same name.
     *
     * @return the result of the job, or empty when it was skipped
     */
    public <T> Optional<T> callExclusively(String jobName, Supplier<T> job) {
        try (Connection connection = dataSource.getConnection()) {
            if (!tryLock(connection, jobName)) {
                log.info("Skipped scheduled job '{}': another instance is running it", jobName);
                return Optional.empty();
            }
            try {
                return Optional.ofNullable(job.get());
            } finally {
                unlock(connection, jobName);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not lock scheduled job '" + jobName + "'", exception);
        }
    }

    private boolean tryLock(Connection connection, String jobName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "select pg_try_advisory_lock(hashtext(?))")) {
            statement.setString(1, lockName(jobName));
            try (ResultSet result = statement.executeQuery()) {
                return result.next() && result.getBoolean(1);
            }
        }
    }

    private void unlock(Connection connection, String jobName) {
        try (PreparedStatement statement = connection.prepareStatement("select pg_advisory_unlock(hashtext(?))")) {
            statement.setString(1, lockName(jobName));
            statement.execute();
        } catch (SQLException exception) {
            log.warn("Could not release the lock of scheduled job '{}': {}", jobName, exception.getMessage());
        }
    }

    private static String lockName(String jobName) {
        return "overlab:job:" + jobName;
    }
}
