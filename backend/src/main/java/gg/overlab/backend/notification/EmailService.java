package gg.overlab.backend.notification;

import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.user.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String LOGO_PATH = "/email-logo.png";
    private static final int MAX_ATTEMPTS = 3;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(5);

    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.contact-email:}")
    private String contactEmail;

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendVerification(User user, String rawToken) {
        deliver(user.getEmail(), null, new EmailTemplate(
                "Confirm your Overlab email",
                "Hi " + user.getDisplayName() + ",",
                List.of("Confirm your email address to finish creating your account."),
                "Confirm email",
                frontendUrl + "/verify-email?token=" + rawToken,
                "If you did not register, ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendPasswordReset(User user, String rawToken) {
        deliver(user.getEmail(), null, new EmailTemplate(
                "Reset your Overlab password",
                "Hi " + user.getDisplayName() + ",",
                List.of("Someone asked to set a new password for your account. The link works for a limited time."),
                "Set a new password",
                frontendUrl + "/reset-password?token=" + rawToken,
                "If you did not request this, ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendEmailChange(User user, String newEmail, String rawToken) {
        deliver(newEmail, null, new EmailTemplate(
                "Confirm your new Overlab email",
                "Hi " + user.getDisplayName() + ",",
                List.of("Confirm this address as the new email of your Overlab account."),
                "Confirm new email",
                frontendUrl + "/verify-email?token=" + rawToken,
                "If you did not request this, ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendGoogleSignInNotice(User user) {
        deliver(user.getEmail(), null, new EmailTemplate(
                "Your Overlab account uses Google sign-in",
                "Hi " + user.getDisplayName() + ",",
                List.of("Someone asked to reset the password for this address, but your account signs in with "
                        + "Google and has no password."),
                "Sign in with Google",
                frontendUrl + "/login",
                "If this was not you, ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendBusinessInquiry(String senderName, String senderEmail, String message) {
        if (!StringUtils.hasText(contactEmail)) {
            log.info("CONTACT_EMAIL is not set, the business message from {} is only stored", senderEmail);
            return;
        }
        deliver(contactEmail, senderEmail, new EmailTemplate(
                "Overlab business message from " + senderName,
                "New message from " + senderName + " (" + senderEmail + "):",
                List.of(message),
                null,
                null,
                "Reply to this email to answer the sender. The message is also stored in the admin panel."));
    }

    private void deliver(String recipient, String replyTo, EmailTemplate template) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                mailSender.send(buildMessage(recipient, replyTo, template));
                return;
            } catch (MailException | MessagingException exception) {
                log.warn("Sending '{}' failed (attempt {}/{}): {}", template.subject(), attempt, MAX_ATTEMPTS,
                        exception.getMessage());
                if (attempt == MAX_ATTEMPTS || !pause()) {
                    log.error("Giving up on '{}'", template.subject());
                    return;
                }
            }
        }
    }

    private MimeMessage buildMessage(String recipient, String replyTo, EmailTemplate template)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(authProperties.mailFrom());
        helper.setTo(recipient);
        if (replyTo != null) {
            helper.setReplyTo(replyTo);
        }
        helper.setSubject(template.subject());
        helper.setText(template.plainText(), template.html(frontendUrl + LOGO_PATH));
        return message;
    }

    private boolean pause() {
        try {
            Thread.sleep(RETRY_DELAY);
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
