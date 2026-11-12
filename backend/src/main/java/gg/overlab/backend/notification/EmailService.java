package gg.overlab.backend.notification;

import gg.overlab.backend.common.Pause;
import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.security.AuthProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.Duration;
import java.util.List;
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
public class EmailService {

    private static final String LOGO_PATH = "/email-logo.png";
    private static final int MAX_ATTEMPTS = 3;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(5);

    private final JavaMailSender mailSender;
    private final AuthProperties authProperties;
    private final String frontendUrl;
    private final String contactEmail;

    public EmailService(JavaMailSender mailSender, AuthProperties authProperties,
                        @Value("${app.frontend-url}") String frontendUrl,
                        @Value("${app.contact-email:}") String contactEmail) {
        this.mailSender = mailSender;
        this.authProperties = authProperties;
        this.frontendUrl = frontendUrl;
        this.contactEmail = contactEmail;
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendVerification(EmailRecipient recipient, String rawToken) {
        deliver(recipient.email(), null, new EmailTemplate(
                "Confirm your Overlab email",
                "Hi " + recipient.displayName() + ",",
                List.of("Confirm your email address to finish creating your account. The link works for "
                        + describe(authProperties.verificationTokenTtl()) + "."),
                "Confirm email",
                frontendUrl + "/verify-email?token=" + rawToken,
                "If you did not register, you can ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendPasswordReset(EmailRecipient recipient, String rawToken) {
        deliver(recipient.email(), null, new EmailTemplate(
                "Reset your Overlab password",
                "Hi " + recipient.displayName() + ",",
                List.of("Someone asked to set a new password for your account. The link works for "
                        + describe(authProperties.resetTokenTtl()) + "."),
                "Set a new password",
                frontendUrl + "/reset-password?token=" + rawToken,
                "If you did not request this, you can ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendEmailChange(EmailRecipient recipient, String newEmail, String rawToken) {
        deliver(newEmail, null, new EmailTemplate(
                "Confirm your new Overlab email",
                "Hi " + recipient.displayName() + ",",
                List.of("Confirm this address as the new email of your Overlab account. The link works for "
                        + describe(authProperties.verificationTokenTtl()) + "."),
                "Confirm new email",
                frontendUrl + "/verify-email?token=" + rawToken,
                "If you did not request this, you can ignore this message."));
    }

    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void sendGoogleSignInNotice(EmailRecipient recipient) {
        deliver(recipient.email(), null, new EmailTemplate(
                "Your Overlab account uses Google sign-in",
                "Hi " + recipient.displayName() + ",",
                List.of("Someone asked to reset the password for this address, but your account signs in with "
                        + "Google and has no password."),
                "Sign in with Google",
                frontendUrl + "/login",
                "If this was not you, you can ignore this message."));
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
                if (attempt == MAX_ATTEMPTS || !Pause.sleep(RETRY_DELAY)) {
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

    private static String describe(Duration duration) {
        long hours = duration.toHours();
        if (hours >= 1) {
            return hours + (hours == 1 ? " hour" : " hours");
        }
        long minutes = Math.max(1, duration.toMinutes());
        return minutes + (minutes == 1 ? " minute" : " minutes");
    }
}
