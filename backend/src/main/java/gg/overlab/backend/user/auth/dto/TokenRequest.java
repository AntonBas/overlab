package gg.overlab.backend.user.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenRequest(@NotBlank String token) {
}
