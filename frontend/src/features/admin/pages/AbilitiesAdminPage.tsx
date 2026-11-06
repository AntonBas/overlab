import { useState, type ChangeEvent } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { AbilityControl } from "../../../types/api";
import { CONTROL_KEYS } from "../../heroes/context/controlSchemeContext";
import {
  ABILITY_CONTROLS,
  ABILITY_CONTROL_LABELS,
} from "../../heroes/utils/abilityControls";
import {
  fetchAdminAbilities,
  fetchAdminHeroes,
  updateAbilityControl,
} from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { SelectField } from "../components/Fields";
import { HeroSelect } from "../components/HeroSelect";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import type { AdminAbility } from "../types";

function optionLabel(control: AbilityControl): string {
  const key = CONTROL_KEYS.PC[control];
  return key
    ? `${ABILITY_CONTROL_LABELS[control]} (${key})`
    : ABILITY_CONTROL_LABELS[control];
}

function isControl(value: string): value is AbilityControl {
  return ABILITY_CONTROLS.some((control) => control === value);
}

function AbilityRows({ heroSlug }: { heroSlug: string }) {
  const abilities = useFetch(() => fetchAdminAbilities(heroSlug), [heroSlug]);
  const [overrides, setOverrides] = useState<
    Record<number, AbilityControl | null>
  >({});
  const save = useSave();

  if (abilities.loading) {
    return <Spinner />;
  }
  if (abilities.error || !abilities.data) {
    return abilities.error ? (
      <ErrorMessage failure={abilities.error} onRetry={abilities.reload} />
    ) : null;
  }

  async function change(
    ability: AdminAbility,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.target.value;
    const control = isControl(value) ? value : null;
    const saved = await save.run(
      () => updateAbilityControl(ability.id, control),
      `${ability.name} saved.`,
    );
    if (saved) {
      setOverrides((current) => ({ ...current, [ability.id]: control }));
    }
  }

  return (
    <>
      <StatusMessage error={save.error} success={save.success} />
      <DataTable
        rows={abilities.data}
        rowKey={(ability) => ability.id}
        pageSize={30}
        columns={[
          {
            header: "Ability",
            render: (ability) => (
              <span className="admin__name">
                <Thumbnail
                  url={ability.iconUrl}
                  width={40}
                  height={40}
                  className="thumbnail--icon"
                />
                {ability.name}
              </span>
            ),
          },
          {
            header: "Control",
            render: (ability) => (
              <SelectField
                label={`Control of ${ability.name}`}
                name={`control-${ability.id}`}
                value={
                  (ability.id in overrides
                    ? overrides[ability.id]
                    : ability.control) ?? ""
                }
                onChange={(event) => change(ability, event)}
              >
                <option value="">Not set</option>
                {ABILITY_CONTROLS.map((control) => (
                  <option key={control} value={control}>
                    {optionLabel(control)}
                  </option>
                ))}
              </SelectField>
            ),
          },
        ]}
      />
    </>
  );
}

export function AbilitiesAdminPage() {
  usePageTitle("Admin: abilities");
  const heroes = useFetch(fetchAdminHeroes, []);
  const [heroSlug, setHeroSlug] = useState("");

  const selected = heroSlug || heroes.data?.[0]?.slug || "";

  return (
    <>
      <PageHeader title="Abilities" />
      {heroes.loading && <Spinner />}
      {heroes.error && (
        <ErrorMessage failure={heroes.error} onRetry={heroes.reload} />
      )}
      {heroes.data && (
        <>
          <HeroSelect
            label="Hero"
            value={selected}
            heroes={heroes.data}
            onChange={setHeroSlug}
          />
          <p className="muted">
            Choose the slot each ability uses; the key in brackets is the PC
            default. The site shows the matching button on PC, Xbox, PlayStation
            and Switch.
          </p>
          {selected && <AbilityRows key={selected} heroSlug={selected} />}
        </>
      )}
    </>
  );
}
