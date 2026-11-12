package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.config.security.UserRole;
import jakarta.validation.constraints.NotNull;

public record SetRoleRequest(@NotNull UserRole role) {
}
