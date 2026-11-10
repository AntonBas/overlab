import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { toFailure } from "../../../services/api";
import { EmailLink } from "../../legal/components/EmailLink";
import { contactEmail } from "../../legal/contact";
import { sendBusinessMessage } from "../api/businessApi";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

export function BusinessPage() {
  usePageTitle("Sponsorship and business");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const length = message.trim().length;
  const ready = name.trim().length >= 2 && email.includes("@");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await sendBusinessMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setSent(true);
    } catch (failure) {
      setError(toFailure(failure).message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="settings">
        <PageHeader title="Thank you" />
        <div className="settings-section">
          <p role="status">
            Your message was sent. We will reply to {email.trim()}.
          </p>
          <Link className="button" to="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <PageHeader
        title="Sponsorship and business"
        subtitle="Advertising, sponsorship and partnership proposals"
      />
      <div className="legal settings-section">
        <section>
          <h2>Work with Overlab</h2>
          <p>
            Overlab is an independent fan site with hero statistics, counters,
            synergies, perks and guides. If you would like to sponsor the site,
            advertise, or propose a partnership, write to us below.
          </p>
          <p>
            Statistics always come from Blizzard's public data and are never
            changed for a sponsor. Paid content is clearly marked as such.
          </p>
          {contactEmail && (
            <p>
              You can also write directly to{" "}
              <EmailLink address={contactEmail} />.
            </p>
          )}
        </section>
      </div>
      <form className="form settings-section" onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="business-name">Your name or company</label>
          <input
            id="business-name"
            type="text"
            maxLength={100}
            autoComplete="organization"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="business-email">Email for the reply</label>
          <input
            id="business-email"
            type="email"
            maxLength={255}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="business-message">Message</label>
          <textarea
            id="business-message"
            rows={6}
            maxLength={MAX_LENGTH}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <span className="feedback-counter muted">
            <span>At least {MIN_LENGTH} characters</span>
            <span>
              {length}/{MAX_LENGTH}
            </span>
          </span>
        </div>
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <div className="form__actions">
          <button
            type="submit"
            className="button"
            disabled={sending || !ready || length < MIN_LENGTH}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
