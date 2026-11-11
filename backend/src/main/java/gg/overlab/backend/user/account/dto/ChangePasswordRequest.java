package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @ValidPassword String newPassword) {
}
