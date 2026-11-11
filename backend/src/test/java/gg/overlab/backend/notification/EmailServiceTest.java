package gg.overlab.backend.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.user.AuthFixtures;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRole;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

class EmailServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final EmailService service = new EmailService(mailSender, AuthFixtures.properties(),
            "https://overlabgg.com", "contact@overlabgg.com");
    private final EmailService serviceWithoutContact = new EmailService(mailSender, AuthFixtures.properties(),
            "https://overlabgg.com", "");
    private final User user = AuthFixtures.user(1, "ana@overlab.gg", UserRole.USER, false);

    @BeforeEach
    void setUp() {
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void verificationEmailGoesToTheUserWithATokenLinkAndTheConfiguredLifetime() throws Exception {
        service.sendVerification(user, "raw-token");

        MimeMessage sent = sentMessage();
        assertThat(sent.getAllRecipients()[0].toString()).isEqualTo("ana@overlab.gg");
        assertThat(sent.getFrom()[0].toString()).isEqualTo("noreply@overlab.gg");
        assertThat(sent.getSubject()).isEqualTo("Confirm your Overlab email");
        assertThat(contentOf(sent)).contains("https://overlabgg.com/verify-email?token=raw-token")
                .contains("24 hours");
    }

    @Test
    void passwordResetUsesTheResetLinkAndOneHourLifetime() throws Exception {
        service.sendPasswordReset(user, "reset-token");

        MimeMessage sent = sentMessage();
        assertThat(sent.getSubject()).isEqualTo("Reset your Overlab password");
        assertThat(contentOf(sent)).contains("https://overlabgg.com/reset-password?token=reset-token")
                .contains("1 hour");
    }

    @Test
    void emailChangeIsSentToTheNewAddress() throws Exception {
        service.sendEmailChange(user, "new@overlab.gg", "change-token");

        assertThat(sentMessage().getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("new@overlab.gg");
    }

    @Test
    void businessInquiryGoesToTheContactAddressWithReplyToTheSender() throws Exception {
        service.sendBusinessInquiry("Ana", "ana@example.com", "Let us talk");

        MimeMessage sent = sentMessage();
        assertThat(sent.getAllRecipients()[0].toString()).isEqualTo("contact@overlabgg.com");
        assertThat(sent.getReplyTo()[0].toString()).isEqualTo("ana@example.com");
        assertThat(contentOf(sent)).contains("Let us talk");
    }

    @Test
    void businessInquiryIsOnlyStoredWhenNoContactAddressIsConfigured() {
        serviceWithoutContact.sendBusinessInquiry("Ana", "ana@example.com", "Let us talk");

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    private MimeMessage sentMessage() {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    private String contentOf(MimeMessage message) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        message.writeTo(output);
        return output.toString(StandardCharsets.UTF_8);
    }
}
