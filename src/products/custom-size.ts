export const CUSTOM_SIZE_PILOT_SLUGS = [
  "appointment-cards",
  "business-flyers-2",
  "brochures",
  "outdoor-wall-decals",
  "vinyl-banners",
  "leaflets",
  "newsletters",
  "event-tickets",
  "plastic-business-cards",
  "standard-business-cards-3",
  "dine-in-menus",
  "waterproof-menus",
  "custom-tissue-paper",
  "poly-mailers",
  "rubber-stamps",
  "pocket-folders",
  "retractable-banners",
  "x-banner-stands",
  "backdrops",
  "rigid-mailers",
  "window-clings",
  "table-tents",
  "vinyl-stickers",
  "magnetic-calendars",
  "dry-erase-magnetic-whiteboard",
  "refrigerator-magnets",
  "business-card-magnets",
  "save-the-date-magnets",
  "notepads",
  "standard-postcards",
  "folded-postcards",
  "foil-postcards",
  "uv-postcard-printing",
  "silk-postcards",
  "raised-spot-uv-postcards",
  "velvet-postcards",
  "dvd-inserts",
  "dvd-covers",
  "rack-cards",
  "custom-labels-roll",
  "custom-labels",
  "tension-fabric-banners",
  "curved-tension-fabric-display",
  "curved-pop-up-display",
  "label-sets",
  "blank-sheet-labels",
  "sheet-labels",
  "vinyl-labels",
  "clear-labels",
  "custom-metallic-labels",
  "kraft-stickers",
  "waterproof-labels",
  "beer-labels",
  "custom-wall-decals",
  "table-runners",
  "reflective-adhesive-vinyl-signs",
  "window-decals",
  "yard-signs",
  "counter-cards",
  "floor-graphics",
  "acrylic-signs",
  "foam-boards",
  "poster-signs",
  "bumper-stickers",
  "real-estate-signs",
  "bulk-stickers",
  "campaign-and-political-stickers",
  "envelope-seals",
  "safety-stickers",
  "custom-stickers-roll",
  "foil-stickers",
  "metallic-stickers",
  "holographic-stickers",
  "kiss-cut-stickers",
  "die-cut-stickers",
  "qr-code-stickers",
  "address-labels-return-address-labels",
  "water-bottle-labels",
  "metallic-bookmarks",
  "spot-uv-bookmarks",
  "foil-bookmarks",
  "silk-bookmarks",
  "bookmarks",
  "metallic-flyers",
  "straight-tension-fabric-display",
  "stretch-table-covers",
  "water-bottle-labels-2",
  "print-buttons",
  "sports-schedule-magnets",
  "silk-flyers",
  "foil-flyers",
  "business-flyers",
  "velvet-business-cards",
  "spot-uv-business-cards",
  "silk-business-cards",
  "painted-edge-business-cards",
  "plastic-business-cards-2",
  "metallic-print-business-cards",
  "foil-business-cards",
  "square-business-cards",
  "standard-business-cards",
  "brochures-2",
  "table-banners",
  "step-and-repeat-banners",
  "custom-stickers",
  "stretched-canvas",
  "rolled-canvas",
  "car-decals",
  "metal-and-aluminum-signs",
  "outdoor-x-banner-stand",
  "booklets",
  "car-magnets",
  "every-door-direct-mail",
  "metallic-postcards",
  "bag-toppers-header-cards",
  "fabric-banners",
  "die-cut-business-cards-2",
  "standard-business-cards-2",
  "calendars",
  "name-labels",
  "warning-labels",
  "wine-labels",
  "candle-labels",
  "custom-labels-2",
  "die-cut-business-cards",
  "deluxe-signicade-a-frame-signs",
  "car-magnets-2",
  "tabletop-banners",
  "awesome-x-banner-stands",
  "trading-cards",
  "die-cut-postcards",
  "poster-stands",
  "lip-balm-labels",
  "die-cut-flyers",
  "circle-business-cards",
  "half-circle-business-cards",
  "leaf-business-cards",
  "raised-spot-uv-business-cards",
  "raised-foil-business-cards",
  "rounded-corner-business-cards",
  "metal-business-cards",
  "folded-business-cards",
  "teardrop-flags",
  "feather-flags",
  "sealing-stickers",
  "stand-up-pouches",
  "printed-tablecloths",
  "poly-draw-bags",
  "custom-gift-bags",
  "custom-gift-bags-2",
  "book-shipping-boxes",
  "mailer-boxes",
  "shipping-boxes",
  "pillow-boxes",
  "custom-product-boxes",
  "wooden-signs",
  "boat-lettering",
  "fleet-lettering",
  "car-and-truck-lettering",
  "transfer-stickers",
  "vinyl-lettering",
  "dtf-transfers",
  "box-sleeves",
  "straight-tuck-end-boxes",
  "reverse-tuck-end-boxes",
  "snap-lock-bottom-boxes",
  "auto-lock-bottom-boxes",
  "five-panel-hanging-boxes",
  "seal-end-boxes",
  "dispenser-boxes",
  "roll-end-tuck-boxes-2",
  "roll-end-tuck-boxes",
  "packaging-sleeves",
  "single-rounded-corner-business-cards",
  "slim-rounded-corner-business-cards",
  "square-rounded-corner-business-cards",
  "sticker-sheets",
  "wine-mailer-boxes",
  "custom-packaging-tape",
  "poly-packing-tape",
  "custom-ribbons-and-bows",
  "wrapping-paper",
  "beverage-boxes",
  "t-shirts",
] as const;

export const CUSTOM_SIZE_VALUE = "__custom_size__";

export function isCustomSizePilot(slug: string) {
  return (CUSTOM_SIZE_PILOT_SLUGS as readonly string[]).includes(slug);
}

export function customSizeUnit(slug: string): "in" | "ft" {
  return slug === "vinyl-banners" ||
    slug === "backdrops" ||
    slug === "table-banners" ||
    slug === "step-and-repeat-banners" ||
    slug === "fabric-banners"
    ? "ft"
    : "in";
}

/** Parse labels like 2" x 3.5", 2 ft. x 4 ft., 6" W x 9" H, 9 ft. (32.54" x 78.64" flag) */
export function parseSizeLabelInches(label: string): { width: number; height: number } | null {
  let text = String(label || "").replace(/,/g, "");
  text = text.replace(/(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/g, (_, a, n, d) =>
    String(Number(a) + Number(n) / Number(d)),
  );
  const namedW = text.match(/(\d+(?:\.\d+)?)\s*(?:["”]|'')?\s*W\b/i);
  const namedH = text.match(/(\d+(?:\.\d+)?)\s*(?:["”]|'')?\s*H\b/i);
  if (namedW && namedH) {
    const width = Number(namedW[1]);
    const height = Number(namedH[1]);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      const ft = /ft/i.test(text) && !/["”]/.test(text);
      const factor = ft ? 12 : 1;
      return { width: width * factor, height: height * factor };
    }
  }
  const head = text.split("(")[0];
  const paren = text.match(/\(([^)]+)\)/);
  const headHasPair = /\d[^x×]*[x×]\s*\d/.test(head);
  const fromChunk = (chunk: string) => {
    const ft = /ft/i.test(chunk);
    const nums = [...chunk.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) {
      return null;
    }
    const factor = ft ? 12 : 1;
    return { width: nums[0] * factor, height: nums[1] * factor };
  };
  if (paren && !headHasPair) {
    const inner = fromChunk(paren[1]);
    if (inner) return inner;
  }
  return fromChunk(text);
}

export function findSizeOptionGroup<T extends { key: string; label: string }>(
  groups: T[],
): T | undefined {
  return groups.find(
    (g) =>
      (/size/i.test(g.label) || /size/i.test(g.key)) &&
      !/table size|pack size|can size|frame size/i.test(g.label),
  );
}

export function parseSingleDimInches(label: string): number | null {
  let text = String(label || "").replace(/,/g, "");
  text = text.replace(/(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/g, (_, a, n, d) =>
    String(Number(a) + Number(n) / Number(d)),
  );
  text = text.replace(/(\d+)\s*\/\s*(\d+)/g, (_, n, d) => String(Number(n) / Number(d)));
  const n = Number(text.match(/(\d+(?:\.\d+)?)/)?.[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export const CUSTOM_SIZE_FALLBACK_INCHES: Record<string, { width: number; height: number }> = {
  "single-rounded-corner-business-cards": { width: 2, height: 3.5 },
  "slim-rounded-corner-business-cards": { width: 1.75, height: 3.5 },
  "square-rounded-corner-business-cards": { width: 2.5, height: 2.5 },
  "sticker-sheets": { width: 8.5, height: 11 },
};

export function resolveBaseSizeInches(
  slug: string,
  groups: { key: string; label: string; values: { value: string; label: string }[] }[],
  selections: Record<string, string>,
): { width: number; height: number } | null {
  const sizeGroup = findSizeOptionGroup(groups);
  if (sizeGroup) {
    const selected = sizeGroup.values.find((v) => v.value === selections[sizeGroup.key]);
    const parsed = parseSizeLabelInches(selected?.label ?? "");
    if (parsed) return parsed;
  }
  const wGroup = groups.find((g) => /^width$/i.test(g.label) || g.key === "attrwidth");
  const hGroup = groups.find((g) => /^height$/i.test(g.label) || g.key === "attrheight");
  if (wGroup && hGroup) {
    const wLab =
      wGroup.values.find((v) => v.value === selections[wGroup.key])?.label ?? "";
    const hLab =
      hGroup.values.find((v) => v.value === selections[hGroup.key])?.label ?? "";
    const w = parseSingleDimInches(wLab);
    const h = parseSingleDimInches(hLab);
    if (w && h) return { width: w, height: h };
  }
  const widthLike = groups.find((g) => /width/i.test(g.label) && !/height/i.test(g.label));
  if (widthLike) {
    const wLab =
      widthLike.values.find((v) => v.value === selections[widthLike.key])?.label ??
      widthLike.values[0]?.label ??
      "";
    const w = parseSingleDimInches(wLab);
    if (w) return { width: w, height: 1 };
  }
  return CUSTOM_SIZE_FALLBACK_INCHES[slug] ?? null;
}

export function toInches(width: number, height: number, unit: "in" | "ft") {
  const factor = unit === "ft" ? 12 : 1;
  return { width: width * factor, height: height * factor };
}

export function customSizeFactor(
  base: { width: number; height: number },
  custom: { width: number; height: number },
) {
  const baseArea = base.width * base.height;
  const customArea = custom.width * custom.height;
  if (!(baseArea > 0) || !(customArea > 0)) return null;
  return customArea / baseArea;
}
