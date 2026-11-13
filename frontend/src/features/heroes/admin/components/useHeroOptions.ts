import { useFetch } from "../../../../hooks/useFetch";
import { fetchAdminHeroes } from "../api/heroesAdminApi";

export function useHeroOptions() {
  return useFetch(fetchAdminHeroes, []);
}
