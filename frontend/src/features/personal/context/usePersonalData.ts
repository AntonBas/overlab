import { useContext } from "react";
import { PersonalDataContext } from "./personalDataContext";

export function usePersonalData() {
  return useContext(PersonalDataContext);
}
