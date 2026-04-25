import type { CSSProperties } from "react";

import { gradientForId, initialsFromName } from "../lib/social-visual";

type SocialAvatarProps = {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: { wh: 40, font: "0.75rem" },
  md: { wh: 52, font: "0.95rem" },
  lg: { wh: 72, font: "1.25rem" },
  xl: { wh: 96, font: "1.75rem" }
} as const;

export function SocialAvatar({ id, name, size = "md" }: SocialAvatarProps) {
  const { wh, font } = sizeMap[size];
  const bg = gradientForId(id);

  return (
    <div
      className="socialAvatar"
      style={
        {
          width: wh,
          height: wh,
          background: bg,
          fontSize: font
        } as CSSProperties
      }
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  );
}
