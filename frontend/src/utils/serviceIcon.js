/**
 * Curated Bootstrap Icons for each service category, chosen so every icon
 * clearly matches the trade. Used by the Home and Services pages.
 */
export const SERVICE_ICONS = {
  Plumber: "droplet-fill",
  Electrician: "lightning-charge-fill",
  Painter: "brush-fill",
  Carpenter: "hammer",
  Mason: "bricks",
  "General Labour": "people-fill",
  Other: "wrench-adjustable",
};

export const KNOWN_SERVICES = Object.keys(SERVICE_ICONS);

export function serviceIcon(name) {
  return SERVICE_ICONS[name] || "tools";
}

export default serviceIcon;
