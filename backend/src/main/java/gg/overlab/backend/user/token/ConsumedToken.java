package gg.overlab.backend.user.token;

import gg.overlab.backend.user.User;

public record ConsumedToken(User user, UserTokenType type) {
}
