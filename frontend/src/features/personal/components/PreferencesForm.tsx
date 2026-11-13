import { useState, type FormEvent } from "react";
import type {
  GameQueue,
  Platform,
  RankTier,
  Region,
} from "../../../types/common";
import type { Preferences } from "../../../types/user";
import { StatusMessage } from "../../../components/admin/StatusMessage";
import { useSave } from "../../../components/admin/useSave";
import { AllItemsIcon } from "../../../components/ui/AllItemsIcon";
import {
  IconSelect,
  type IconSelectOption,
} from "../../../components/ui/IconSelect";
import {
  PLATFORM_OPTIONS,
  QUEUE_OPTIONS,
  RANK_OPTIONS,
  REGION_OPTIONS,
} from "../../stats";
import { savePreferences } from "../api/personalApi";
import { usePersonalData } from "../context/usePersonalData";

const NO_DEFAULT = "";

function toValue<T extends string>(raw: T | typeof NO_DEFAULT): T | null {
  return raw === NO_DEFAULT ? null : raw;
}

function withNoDefault<T extends string>(
  options: readonly IconSelectOption<T>[],
): IconSelectOption<T | typeof NO_DEFAULT>[] {
  return [
    { value: NO_DEFAULT, label: "No default", icon: <AllItemsIcon /> },
    ...options,
  ];
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
    <form onSubmit={submit} className="form preferences-form">
      <IconSelect
        label="Mode"
        value={draft.queue ?? NO_DEFAULT}
        options={withNoDefault(QUEUE_OPTIONS)}
        onChange={(value) =>
          setDraft({ ...draft, queue: toValue<GameQueue>(value) })
        }
      />
      <IconSelect
        label="Rank"
        value={draft.tier ?? NO_DEFAULT}
        options={withNoDefault(RANK_OPTIONS)}
        onChange={(value) =>
          setDraft({ ...draft, tier: toValue<RankTier>(value) })
        }
      />
      <IconSelect
        label="Platform"
        value={draft.platform ?? NO_DEFAULT}
        options={withNoDefault(PLATFORM_OPTIONS)}
        onChange={(value) =>
          setDraft({ ...draft, platform: toValue<Platform>(value) })
        }
      />
      <IconSelect
        label="Region"
        value={draft.region ?? NO_DEFAULT}
        options={withNoDefault(REGION_OPTIONS)}
        onChange={(value) =>
          setDraft({ ...draft, region: toValue<Region>(value) })
        }
      />
      <div className="preferences-form__footer">
        <button type="submit" className="button" disabled={save.saving}>
          Save defaults
        </button>
        <StatusMessage error={save.error} />
      </div>
    </form>
  );
}
