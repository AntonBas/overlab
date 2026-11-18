interface ListSkeletonProps {
  kind: "hero-tiles" | "map-cards";
  label: string;
}

const HERO_SECTIONS = 3;
const HERO_TILES_PER_SECTION = 7;
const MAP_CARDS = 6;

function items(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

export function ListSkeleton({ kind, label }: ListSkeletonProps) {
  return (
    <div
      className="list-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="visually-hidden">{label}...</span>
      <div aria-hidden="true">
        {kind === "hero-tiles" &&
          items(HERO_SECTIONS).map((section) => (
            <div key={section} className="list-skeleton__section">
              <div className="list-skeleton__block list-skeleton__heading" />
              <div className="list-skeleton__tiles">
                {items(HERO_TILES_PER_SECTION).map((tile) => (
                  <div
                    key={tile}
                    className="list-skeleton__block list-skeleton__tile"
                  />
                ))}
              </div>
            </div>
          ))}
        {kind === "map-cards" && (
          <div className="list-skeleton__maps">
            {items(MAP_CARDS).map((card) => (
              <div
                key={card}
                className="list-skeleton__block list-skeleton__map"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
