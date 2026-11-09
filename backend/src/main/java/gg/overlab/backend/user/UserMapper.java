package gg.overlab.backend.user;

import gg.overlab.backend.user.dto.UserDto;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.getProvider(),
                user.isEmailVerified());
    }
}
