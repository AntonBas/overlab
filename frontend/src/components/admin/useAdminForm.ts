import { useCallback, useState } from "react";
import { useSave, type SaveState } from "./useSave";
import { useUnsavedChanges } from "./unsavedChanges";

interface AdminForm<Values> {
  values: Values;
  change: <Key extends keyof Values>(key: Key, value: Values[Key]) => void;
  dirty: boolean;
  save: SaveState;
}

export function useAdminForm<Values extends object>(
  initial: Values,
  extraDirty: boolean = false,
): AdminForm<Values> {
  const [values, setValues] = useState(initial);
  const save = useSave();
  const dirty =
    extraDirty || JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty && !save.success);

  const change = useCallback(
    <Key extends keyof Values>(key: Key, value: Values[Key]) =>
      setValues((current) => ({ ...current, [key]: value })),
    [],
  );

  return { values, change, dirty, save };
}
