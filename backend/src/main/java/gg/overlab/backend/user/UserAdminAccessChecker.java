package gg.overlab.backend.user;

import gg.overlab.backend.config.security.AdminAccessChecker;
import gg.overlab.backend.config.security.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserAdminAccessChecker implements AdminAccessChecker {

    private final UserRepository userRepository;

    @Override
    public boolean isActiveAdmin(Long userId) {
        return userRepository.findById(userId)
                .filter(User::isEnabled)
                .map(User::getRole)
                .filter(UserRole.ADMIN::equals)
                .isPresent();
    }
}
