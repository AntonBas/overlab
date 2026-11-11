package gg.overlab.backend.user.auth.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @ValidPassword String password) {
}
