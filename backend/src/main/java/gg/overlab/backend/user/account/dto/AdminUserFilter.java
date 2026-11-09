package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;

public record AdminUserFilter(String query, UserRole role, Boolean enabled, Boolean emailVerified,
                              AuthProvider provider, String sortBy, boolean ascending) {
}
