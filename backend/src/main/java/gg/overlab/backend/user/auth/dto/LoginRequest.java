package gg.overlab.backend.user.auth.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 255) String email,
        @NotBlank @ValidPassword(minLength = 1) String password) {
}
