package gg.overlab.backend.user.auth.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @ValidPassword String password,
        @NotBlank @Size(min = 2, max = 64) String displayName) {
}
