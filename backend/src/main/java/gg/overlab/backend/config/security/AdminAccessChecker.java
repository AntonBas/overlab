package gg.overlab.backend.config.security;

public interface AdminAccessChecker {

    boolean isActiveAdmin(Long userId);
}
