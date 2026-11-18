import { Link } from "react-router-dom";
import { contactEmail } from "../contact";
import { EmailLink } from "./EmailLink";

export function ContactLine() {
  if (!contactEmail) {
    return (
      <p>
        Contact: use the <Link to="/feedback">feedback form</Link>.
      </p>
    );
  }
  return (
    <p>
      Contact: <EmailLink address={contactEmail} />
    </p>
  );
}
