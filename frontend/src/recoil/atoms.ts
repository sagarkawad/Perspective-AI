import { atom } from "recoil";

export const textState = atom<string | null>({
  key: "textState",
  default:
    "The coming decade promises unprecedented advances in agent capabilities, but their ultimate success will be measured not just by technical achievements, but by their positive impact on society. Continued interdisciplinary collaboration across computer science, cognitive science, ethics, and domain-specific fields will be essential to realizing the full potential of AI agents while mitigating risks. As this technology matures, maintaining a human-centered approach will ensure AI agents evolve as trusted partners rather than opaque automations.",
});
