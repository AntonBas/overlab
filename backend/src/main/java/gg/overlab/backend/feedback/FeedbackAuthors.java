package gg.overlab.backend.feedback;

import java.util.Collection;
import java.util.Map;

public interface FeedbackAuthors {

    Map<Long, String> displayNames(Collection<Long> userIds);
}
