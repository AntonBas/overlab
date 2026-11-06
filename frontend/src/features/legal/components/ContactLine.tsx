import { contactEmail } from "../contact";

export function ContactLine() {
  if (!contactEmail) {
    return <p>Contact details are published on the site's home page.</p>;
  }
  return (
    <p>
      Contact: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
    </p>
  );
}
