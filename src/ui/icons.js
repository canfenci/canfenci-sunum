export const ICONS = Object.freeze({
  play: ["M5 3l14 9-14 9V3z"],
  pause: ["M8 5v14", "M16 5v14"],
  "chevron-right": ["m9 18 6-6-6-6"],
  "chevron-left": ["m15 18-6-6 6-6"],
  maximize: ["M15 3h6v6", "M9 21H3v-6", "M21 3l-7 7", "M3 21l7-7"],
  wrench: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  "rotate-ccw": ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"],
  "help-circle": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4", "M12 17h.01"],
  pencil: ["M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", "m15 5 4 4"],
  highlighter: ["m9 11-6 6v3h9l3-3", "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"],
  eraser: ["m7 21-4.3-4.3a2.26 2.26 0 0 1 0-3.2L13.4 2.7a2.26 2.26 0 0 1 3.2 0l4.7 4.7a2.26 2.26 0 0 1 0 3.2L11 21", "M22 21H7", "m5 11 9 9"],
  zap: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  timer: ["M10 2h4", "M12 14v-4", "M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m4.93 4.93 1.42 1.42"],
  notebook: ["M6 2h13a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6V2z", "M6 6H3", "M6 10H3", "M6 14H3", "M6 18H3"],
  "eye-off": ["M10.73 5.08A10.74 10.74 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68", "M14.08 14.16a3 3 0 0 1-4.24-4.24", "M17.48 17.5A10.75 10.75 0 0 1 12 19C5 19 2 12 2 12a13.1 13.1 0 0 1 3.3-4.7", "M2 2l20 20"],
  settings: ["M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  crosshair: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M22 12h-4", "M6 12H2", "M12 6V2", "M12 22v-4"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["m20 6-11 11-5-5"]
});

export function icon(name, size = 20, className = "") {
  const resolvedName = name === "pencil" && className.split(/\s+/).includes("icon-highlighter")
    ? "highlighter"
    : name === "settings" && className === ""
      ? "crosshair"
      : name;
  const paths = ICONS[resolvedName];
  if (!paths) return "";
  const iconSize = Number.isFinite(Number(size)) ? Number(size) : 20;
  const classes = ["icon", className].filter(Boolean).join(" ");
  return `<svg class="${classes}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths.map((path) => `<path d="${path}"></path>`).join("")}</svg>`;
}
