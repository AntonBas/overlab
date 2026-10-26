import { useState, type FormEvent } from "react";
import type {
  GameQueue,
  Platform,
  Preferences,
  RankTier,
  Region,
} from "../../../types/api";
import {
  PLATFORM_LABELS,
  QUEUE_LABELS,
  REGION_LABELS,
  TIER_LABELS,
} from "../../../utils/format";
import { SelectField } from "../../admin/components/Fields";
import { StatusMessage } from "../../admin/components/StatusMessage";
import { useSave } from "../../admin/components/useSave";
import { PLATFORMS, QUEUES, REGIONS, TIERS } from "../../stats/filters";
import { savePreferences } from "../api/personalApi";
import { usePersonalData } from "../context/usePersonalData";

function toValue<T extends string>(raw: string): T | null {
  return raw === "" ? null : (raw as T);
}

export function PreferencesForm() {
  const { preferences, replacePreferences } = usePersonalData();
  const [draft, setDraft] = useState<Preferences>(
    preferences ?? { queue: null, platform: null, region: null, tier: null },
  );
  const save = useSave();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await save.run(async () => {
      replacePreferences(await savePreferences(draft));
    }, "Default filters saved.");
  }

  return (
    <form onSubmit={submit} className="form">
      <SelectField
        label="Mode"
        name="preferredQueue"
        value={draft.queue ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, queue: toValue<GameQueue>(event.target.value) })
        }
      >
        <option value="">No default</option>
        {QUEUES.map((value) => (
          <option key={value} value={value}>
            {QUEUE_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Rank"
        name="preferredTier"
        value={draft.tier ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, tier: toValue<RankTier>(event.target.value) })
        }
      >
        <option value="">No default</option>
        {TIERS.map((value) => (
          <option key={value} value={value}>
            {TIER_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Platform"
        name="preferredPlatform"
        value={draft.platform ?? ""}
        onChange={(event) =>
          setDraft({
            ...draft,
            platform: toValue<Platform>(event.target.value),
          })
        }
      >
        <option value="">No default</option>
        {PLATFORMS.map((value) => (
          <option key={value} value={value}>
            {PLATFORM_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Region"
        name="preferredRegion"
        value={draft.region ?? ""}
        onChange={(event) =>
          setDraft({ ...draft, region: toValue<Region>(event.target.value) })
        }
      >
        <option value="">No default</option>
        {REGIONS.map((value) => (
          <option key={value} value={value}>
            {REGION_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <StatusMessage error={save.error} success={save.success} />
      <button type="submit" className="button" disabled={save.saving}>
        Save defaults
      </button>
    </form>
  );
}
