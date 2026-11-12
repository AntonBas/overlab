package gg.overlab.backend.user.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(min = 2, max = 64)
        @Pattern(regexp = "^\\S(?:[^\\p{Cntrl}]*\\S)?$",
                message = "must not start or end with spaces or contain control characters") String displayName) {
}
