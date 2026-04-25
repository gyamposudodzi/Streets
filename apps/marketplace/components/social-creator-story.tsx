import Link from "next/link";

import type { CreatorSummary } from "@streets/types";

import { storyRingGradient } from "../lib/social-visual";
import { SocialAvatar } from "./social-avatar";

type SocialCreatorStoryProps = {
  creator: CreatorSummary;
};

export function SocialCreatorStory({ creator }: SocialCreatorStoryProps) {
  const ring = storyRingGradient(creator.user_id);

  return (
    <Link
      href={`/search?creator=${creator.user_id}`}
      className="socialStory"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="socialStoryRing" style={{ background: ring }}>
        <div className="socialStoryInner">
          <SocialAvatar id={creator.user_id} name={creator.display_name} size="md" />
        </div>
      </div>
      <span className="socialStoryLabel">{creator.display_name.split(" ")[0]}</span>
    </Link>
  );
}
