package gg.overlab.backend.user.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.nio.charset.StandardCharsets;

public class ValidPasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final int BCRYPT_MAX_BYTES = 72;

    private int minLength;

    @Override
    public void initialize(ValidPassword constraint) {
        this.minLength = constraint.minLength();
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return true;
        }
        return password.length() >= minLength && password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }
}
