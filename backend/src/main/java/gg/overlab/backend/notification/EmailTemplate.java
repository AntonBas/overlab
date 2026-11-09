package gg.overlab.backend.notification;

import java.util.List;
import org.springframework.web.util.HtmlUtils;

public record EmailTemplate(String subject, String greeting, List<String> paragraphs, String actionLabel,
                            String actionUrl, String footnote) {

    private static final String HTML_LAYOUT = """
            <!doctype html>
            <html lang="en">
            <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" \
            style="max-width:520px;background:#ffffff;border-radius:8px;padding:32px">
            <tr><td style="font-size:20px;font-weight:bold;padding-bottom:16px">
            <img src="%s" width="40" height="40" alt="" \
            style="vertical-align:middle;border-radius:8px;margin-right:12px">Overlab</td></tr>
            <tr><td style="font-size:15px;line-height:1.5">
            %s
            </td></tr>
            <tr><td style="font-size:12px;line-height:1.4;color:#9ca3af;padding-top:24px;\
            border-top:1px solid #e5e7eb">Overlab is an unofficial fan site and is not affiliated with \
            Blizzard Entertainment.</td></tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """;

    public String plainText() {
        StringBuilder text = new StringBuilder(greeting).append("\n\n");
        paragraphs.forEach(paragraph -> text.append(paragraph).append("\n\n"));
        if (actionUrl != null) {
            text.append(actionLabel).append(":\n").append(actionUrl).append("\n\n");
        }
        return text.append(footnote).toString();
    }

    public String html(String logoUrl) {
        StringBuilder body = new StringBuilder("<p>").append(escape(greeting)).append("</p>");
        paragraphs.forEach(paragraph -> body.append("<p>").append(escape(paragraph)).append("</p>"));
        if (actionUrl != null) {
            body.append("<p style=\"margin:24px 0\"><a href=\"").append(escape(actionUrl))
                    .append("\" style=\"background:#f97316;color:#ffffff;text-decoration:none;padding:12px 20px;")
                    .append("border-radius:6px;display:inline-block;font-weight:bold\">")
                    .append(escape(actionLabel)).append("</a></p>");
        }
        body.append("<p style=\"font-size:13px;color:#6b7280\">").append(escape(footnote)).append("</p>");
        return HTML_LAYOUT.formatted(escape(logoUrl), body);
    }

    private static String escape(String value) {
        return HtmlUtils.htmlEscape(value).replace("\n", "<br>");
    }
}
