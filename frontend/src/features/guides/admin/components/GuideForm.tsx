import { useState, type FormEvent } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { useFetch } from "../../../../hooks/useFetch";
import type { Guide, GuideKind, GuideSide } from "../../../../types/guide";
import type { GameMap } from "../../../../types/map";
import { fetchHeroAbilities } from "../../../abilities";
import {
  GUIDE_KIND_LABELS,
  GUIDE_KINDS,
  GUIDE_SIDE_LABELS,
  GUIDE_SIDES,
} from "../..";
import { createGuide, updateGuide } from "../api/guidesAdminApi";
import type { AdminHero } from "../../../heroes/admin";
import {
  formatTimestamp,
  parseTimestamp,
  parseYoutubeId,
  slugify,
} from "../utils/youtube";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
} from "../../../../components/admin/Fields";
import { HeroSelect } from "../../../heroes/admin";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useAdminForm } from "../../../../components/admin/useAdminForm";

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
    endTimestamp:
      guide?.endSeconds != null ? formatTimestamp(guide.endSeconds) : "",
    kind: (guide?.kind ?? "SETUP") as GuideKind,
    side: (guide?.side ?? "BOTH") as GuideSide,
    abilitySlug: guide?.abilitySlug ?? "",
    description: guide?.description ?? "",
    sortOrder: String(guide?.sortOrder ?? 0),
    published: guide?.published ?? false,
  };
  const { values, change, save } = useAdminForm(initial);
  const [validated, setValidated] = useState(false);

  const youtubeId = parseYoutubeId(values.video);
  const startSeconds = parseTimestamp(values.timestamp);
  const endSeconds =
    values.endTimestamp.trim() === ""
      ? null
      : parseTimestamp(values.endTimestamp);
  const abilities = useFetch(
    () =>
      values.heroSlug
        ? fetchHeroAbilities(values.heroSlug)
        : Promise.resolve([]),
    [values.heroSlug],
  );
  const sortOrder = Number(values.sortOrder);
  const localErrors: Record<string, string> = {};
  if (youtubeId === null) {
    localErrors.youtubeId =
      "Paste a YouTube link (youtu.be/... or watch?v=...) or an 11-character ID.";
  }
  if (startSeconds === null) {
    localErrors.startSeconds = "Use the format 1:23 or 1:02:03.";
  }
  if (values.endTimestamp.trim() !== "") {
    if (endSeconds === null) {
      localErrors.endSeconds = "Use the format 1:23 or 1:02:03.";
    } else if (startSeconds !== null && endSeconds <= startSeconds) {
      localErrors.endSeconds = "The end must be after the start.";
    }
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
      endSeconds,
      kind: values.kind,
      side: values.side,
      abilitySlug: values.abilitySlug === "" ? null : values.abilitySlug,
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
      <h2>{guide ? `Edit ${guide.title}` : "New spot or setup"}</h2>
      <HeroSelect
        label="Hero"
        value={values.heroSlug}
        heroes={heroes}
        placeholder="Choose a hero"
        error={errors.heroSlug}
        onChange={(slug) => {
          if (slug !== values.heroSlug) {
            change("abilitySlug", "");
          }
          change("heroSlug", slug);
        }}
      />
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
      <SelectField
        label="Type"
        name="kind"
        value={values.kind}
        onChange={(event) => change("kind", event.target.value as GuideKind)}
      >
        {GUIDE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {GUIDE_KIND_LABELS[kind]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Side"
        name="side"
        value={values.side}
        onChange={(event) => change("side", event.target.value as GuideSide)}
      >
        {GUIDE_SIDES.map((side) => (
          <option key={side} value={side}>
            {GUIDE_SIDE_LABELS[side]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Ability (optional)"
        name="abilitySlug"
        value={values.abilitySlug}
        error={errors.abilitySlug}
        onChange={(event) => change("abilitySlug", event.target.value)}
      >
        <option value="">None</option>
        {(abilities.data ?? []).map((ability) => (
          <option key={ability.slug} value={ability.slug}>
            {ability.name.trim()}
          </option>
        ))}
      </SelectField>
      <FormField
        label="Start time"
        name="startSeconds"
        placeholder="1:23"
        value={values.timestamp}
        error={errors.startSeconds}
        onChange={(event) => change("timestamp", event.target.value)}
      />
      <FormField
        label="End time (optional)"
        name="endSeconds"
        placeholder="1:45"
        value={values.endTimestamp}
        error={errors.endSeconds}
        hint="The clip stops here."
        onChange={(event) => change("endTimestamp", event.target.value)}
      />
      {youtubeId && (
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?start=${startSeconds ?? 0}${endSeconds ? `&end=${endSeconds}` : ""}`}
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
