export type MapMode =
  "CONTROL" | "ESCORT" | "HYBRID" | "PUSH" | "FLASHPOINT" | "CLASH";

export interface GameMap {
  slug: string;
  name: string;
  mode: MapMode | null;
  imageUrl: string | null;
}
