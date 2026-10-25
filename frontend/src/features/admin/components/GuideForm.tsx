import { useState, type FormEvent } from "react";
import { FormField } from "../../../components/ui/FormField";
import type { GameMap, Guide } from "../../../types/api";
import { createGuide, updateGuide } from "../api/adminApi";
import type { AdminHero } from "../types";
import {
  formatTimestamp,
  parseTimestamp,
  parseYoutubeId,
  slugify,
} from "../utils/youtube";
import { CheckboxField, SelectField, TextAreaField } from "./Fields";
import { StatusMessage } from "./StatusMessage";
import { useSave } from "./useSave";
import { useUnsavedChanges } from "./unsavedChanges";

interface GuideFormProps {
  guide: Guide | null;
  heroes: AdminHero[];
  maps: GameMap[];
  onSaved: () => void;
  onClose: () => void;
}

export function GuideForm({
  guide,
  heroes,
  maps,
  onSaved,
  onClose,
}: GuideFormProps) {
  const initial = {
    heroSlug: guide?.heroSlug ?? "",
    mapSlug: guide?.mapSlug ?? "",
    title: guide?.title ?? "",
    slug: guide?.slug ?? "",
    video: guide?.youtubeId ?? "",
    timestamp: guide ? formatTimestamp(guide.startSeconds) : "",
    description: guide?.description ?? "",
    sortOrder: String(guide?.sortOrder ?? 0),
    published: guide?.published ?? false,
  };
  const [values, setValues] = useState(initial);
  const [validated, setValidated] = useState(false);
  const save = useSave();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  function change<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const youtubeId = parseYoutubeId(values.video);
  const startSeconds = parseTimestamp(values.timestamp);
  const sortOrder = Number(values.sortOrder);
  const localErrors: Record<string, string> = {};
  if (youtubeId === null) {
    localErrors.youtubeId =
      "Paste a YouTube link (youtu.be/... or watch?v=...) or an 11 character id.";
  }
  if (startSeconds === null) {
    localErrors.startSeconds = "Use the format 1:23 or 1:02:03.";
  }
  if (!Number.isInteger(sortOrder)) {
    localErrors.sortOrder = "Use a whole number.";
  }
  if (values.heroSlug === "") {
    localErrors.heroSlug = "Choose a hero.";
  }
  if (values.title.trim() === "") {
    localErrors.title = "Enter a title.";
  }
  const errors = validated
    ? { ...save.fieldErrors, ...localErrors }
    : save.fieldErrors;
  const suggestedSlug = slugify(values.title);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidated(true);
    if (Object.keys(localErrors).length > 0 || youtubeId === null) {
      return;
    }
    const payload = {
      heroSlug: values.heroSlug,
      mapSlug: values.mapSlug === "" ? null : values.mapSlug,
      title: values.title.trim(),
      slug: values.slug.trim() === "" ? null : values.slug.trim(),
      youtubeId,
      startSeconds: startSeconds ?? 0,
      description: values.description.trim() === "" ? null : values.description,
      sortOrder,
      published: values.published,
    };
    const saved = await save.run(
      () => (guide ? updateGuide(guide.id, payload) : createGuide(payload)),
      "Guide saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit} noValidate>
      <h2>{guide ? `Edit ${guide.title}` : "New guide"}</h2>
      <SelectField
        label="Hero"
        name="heroSlug"
        value={values.heroSlug}
        error={errors.heroSlug}
        onChange={(event) => change("heroSlug", event.target.value)}
      >
        <option value="">Choose a hero</option>
        {heroes.map((hero) => (
          <option key={hero.slug} value={hero.slug}>
            {hero.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Map (optional)"
        name="mapSlug"
        value={values.mapSlug}
        error={errors.mapSlug}
        onChange={(event) => change("mapSlug", event.target.value)}
      >
        <option value="">Any map</option>
        {maps.map((map) => (
          <option key={map.slug} value={map.slug}>
            {map.name}
          </option>
        ))}
      </SelectField>
      <FormField
        label="Title"
        name="title"
        value={values.title}
        error={errors.title}
        onChange={(event) => change("title", event.target.value)}
      />
      <FormField
        label="Slug"
        name="slug"
        value={values.slug}
        error={errors.slug}
        hint={
          suggestedSlug
            ? `Leave empty to generate it. Suggestion: ${suggestedSlug}`
            : "Leave empty to generate it from the title."
        }
        onChange={(event) => change("slug", event.target.value)}
      />
      <FormField
        label="YouTube link"
        name="youtubeId"
        value={values.video}
        error={errors.youtubeId}
        hint={youtubeId ? `Video id: ${youtubeId}` : undefined}
        onChange={(event) => change("video", event.target.value)}
      />
      <FormField
        label="Start time"
        name="startSeconds"
        placeholder="1:23"
        value={values.timestamp}
        error={errors.startSeconds}
        onChange={(event) => change("timestamp", event.target.value)}
      />
      {youtubeId && (
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?start=${startSeconds ?? 0}`}
            title="Video preview"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
      <TextAreaField
        label="Description"
        name="description"
        value={values.description}
        error={errors.description}
        onChange={(event) => change("description", event.target.value)}
      />
      <FormField
        label="Sort order"
        name="sortOrder"
        inputMode="numeric"
        value={values.sortOrder}
        error={errors.sortOrder}
        hint="Lower numbers appear first."
        onChange={(event) => change("sortOrder", event.target.value)}
      />
      <CheckboxField
        label="Published"
        name="published"
        hint="Unpublished guides are only visible here."
        checked={values.published}
        onChange={(event) => change("published", event.target.checked)}
      />
      <StatusMessage error={save.error} />
      <div className="form__actions">
        <button type="submit" className="button" disabled={save.saving}>
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
