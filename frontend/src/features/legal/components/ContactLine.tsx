import { Link } from "react-router-dom";
import { contactEmail } from "../contact";

export function ContactLine() {
  if (!contactEmail) {
    return (
      <p>
        Contact: use the form on the <Link to="/business">business page</Link>.
      </p>
    );
  }
  return (
    <p>
      Contact: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
    </p>
  );
}
