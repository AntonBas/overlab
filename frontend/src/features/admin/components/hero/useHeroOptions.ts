import { useFetch } from "../../../../hooks/useFetch";
import { fetchAdminHeroes } from "../../api/adminApi";

export function useHeroOptions() {
  return useFetch(fetchAdminHeroes, []);
}
