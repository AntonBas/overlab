package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.user.auth.dto.LoginRequest;
import gg.overlab.backend.user.auth.dto.RegisterRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class ValidPasswordValidatorTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsPasswordsBetweenEightAndSeventyTwoBytes() {
        assertThat(validator.validate(register("12345678"))).isEmpty();
        assertThat(validator.validate(register("a".repeat(72)))).isEmpty();
    }

    @Test
    void rejectsShortPasswords() {
        assertThat(validator.validate(register("1234567"))).hasSize(1);
    }

    @Test
    void rejectsPasswordsLongerThanSeventyTwoBytesEvenWhenShortInCharacters() {
        assertThat(validator.validate(register("a".repeat(73)))).hasSize(1);
        assertThat(validator.validate(register("щ".repeat(37)))).hasSize(1);
        assertThat(validator.validate(register("щ".repeat(36)))).isEmpty();
    }

    @Test
    void loginAcceptsAnyShortPasswordButNotOversizedOnes() {
        assertThat(validator.validate(new LoginRequest("a@overlab.gg", "x"))).isEmpty();
        assertThat(validator.validate(new LoginRequest("a@overlab.gg", "a".repeat(73)))).hasSize(1);
    }

    private RegisterRequest register(String password) {
        return new RegisterRequest("ana@overlab.gg", password, "Ana");
    }
}
