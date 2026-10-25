package gg.overlab.backend.user.auth;

import gg.overlab.backend.user.dto.UserDto;

public record AuthTokens(String accessToken, String refreshToken, UserDto user) {
}
