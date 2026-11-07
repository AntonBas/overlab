package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.UserRole;
import jakarta.validation.constraints.NotNull;

public record SetRoleRequest(@NotNull UserRole role) {
}
