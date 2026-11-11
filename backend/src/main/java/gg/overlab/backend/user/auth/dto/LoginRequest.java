package gg.overlab.backend.user.auth.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String email, @NotBlank @ValidPassword(minLength = 1) String password) {
}
