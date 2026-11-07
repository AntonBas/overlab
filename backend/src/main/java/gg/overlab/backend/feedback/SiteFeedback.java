package gg.overlab.backend.feedback;

import gg.overlab.backend.common.TimestampedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "site_feedback")
public class SiteFeedback extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeedbackType type;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "page_path", length = 255)
    private String pagePath;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeedbackStatus status = FeedbackStatus.NEW;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
