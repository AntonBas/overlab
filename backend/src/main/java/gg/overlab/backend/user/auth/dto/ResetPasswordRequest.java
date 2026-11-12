package gg.overlab.backend.user.auth.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(max = 128) String token,
        @NotBlank @ValidPassword String password) {
}
