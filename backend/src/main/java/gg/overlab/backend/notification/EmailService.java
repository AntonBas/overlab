package gg.overlab.backend.notification;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerification(User user, String rawToken) {
        send(user, "Confirm your Overlab email",
                "Hi " + user.getDisplayName() + ",\n\nConfirm your email address:\n"
                        + frontendUrl + "/verify-email?token=" + rawToken
                        + "\n\nIf you did not register, ignore this message.");
    }

    public void sendPasswordReset(User user, String rawToken) {
        send(user, "Reset your Overlab password",
                "Hi " + user.getDisplayName() + ",\n\nSet a new password:\n"
                        + frontendUrl + "/reset-password?token=" + rawToken
                        + "\n\nIf you did not request this, ignore this message.");
    }

    public void sendEmailChange(User user, String newEmail, String rawToken) {
        send(user, newEmail, "Confirm your new Overlab email",
                "Hi " + user.getDisplayName() + ",\n\nConfirm this address as your new Overlab email:\n"
                        + frontendUrl + "/verify-email?token=" + rawToken
                        + "\n\nIf you did not request this, ignore this message.");
    }

    public void sendGoogleSignInNotice(User user) {
        send(user, "Your Overlab account uses Google sign-in",
                "Hi " + user.getDisplayName() + ",\n\nSomeone asked to reset the password for this address, but your "
                        + "account signs in with Google and has no password. Use \"Sign in with Google\" at "
                        + frontendUrl + "/login.\n\nIf this was not you, ignore this message.");
    }

    private void send(User user, String subject, String text) {
        send(user, user.getEmail(), subject, text);
    }

    private void send(User user, String recipient, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(authProperties.mailFrom());
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(text);
        try {
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.error("Failed to send '{}' email to user {}: {}", subject, user.getId(), exception.getMessage());
        }
    }
}
