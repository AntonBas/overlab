import { useRef, useState, type ChangeEvent } from "react";
import { toFailure } from "../../../../services/api";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

interface ImageUploadFieldProps {
  label: string;
  imageUrl: string | null;
  onUpload: (file: File) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

export function ImageUploadField({
  label,
  imageUrl,
  onUpload,
  onRemove,
}: ImageUploadFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(toFailure(failure).message);
    } finally {
      setBusy(false);
      if (input.current) {
        input.current.value = "";
      }
    }
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG and WebP images are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The image must not exceed 2 MB.");
      return;
    }
    await run(() => onUpload(file));
  }

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="image-upload">
        {imageUrl ? (
          <img className="image-upload__preview" src={imageUrl} alt="" />
        ) : (
          <span className="muted">No image</span>
        )}
        <label className="button button--ghost">
          {imageUrl ? "Replace" : "Upload"}
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="visually-hidden"
            disabled={busy}
            aria-label={`${label} file`}
            onChange={choose}
          />
        </label>
        {imageUrl && (
          <button
            type="button"
            className="button button--ghost"
            disabled={busy}
            onClick={() => run(onRemove)}
          >
            Remove
          </button>
        )}
      </div>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
