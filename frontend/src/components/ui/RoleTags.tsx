import type { HeroRole } from "../../types/api";
import { ROLE_DESCRIPTIONS, SUBROLE_DESCRIPTIONS } from "../../utils/roles";
import { InfoChip } from "./InfoChip";
import { RoleBadge } from "./RoleBadge";
import { SubroleBadge } from "./SubroleBadge";
import "./ui.css";

interface RoleTagsProps {
  role: HeroRole;
  subrole: string | null;
}

export function RoleTags({ role, subrole }: RoleTagsProps) {
  return (
    <span className="role-tags">
      <InfoChip description={ROLE_DESCRIPTIONS[role]}>
        <RoleBadge role={role} />
      </InfoChip>
      {subrole && (
        <InfoChip description={SUBROLE_DESCRIPTIONS[subrole.toLowerCase()]}>
          <SubroleBadge subrole={subrole} />
        </InfoChip>
      )}
    </span>
  );
}
