import { Check, Copy } from "lucide-react";
import { useState } from "react";

const CONFIRMATION_MILLISECONDS = 2000;

function copyWithSelection(text: string): boolean {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(field);
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyWithSelection(text);
  }
}

export function EmailLink({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyToClipboard(address)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), CONFIRMATION_MILLISECONDS);
    }
  };

  return (
    <>
      <a href={`mailto:${address}`}>{address}</a>{" "}
      <button
        type="button"
        className="email-copy"
        aria-label={copied ? "Email copied" : "Copy email"}
        title={copied ? "Copied" : "Copy email"}
        onClick={() => void copy()}
      >
        {copied ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
