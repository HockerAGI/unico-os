// src/lib/project.js

const SAFE_MAX = 64;

function cleanId(v, fallback) {
  const s = String(v || "").trim().toLowerCase();
  const normalized = s
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, SAFE_MAX);

  return normalized || fallback;
}

export function defaultProjectId() {
  return cleanId(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID, "score-store");
}

export function defaultNodeId() {
  return cleanId(process.env.NEXT_PUBLIC_DEFAULT_NODE_ID, "unicos");
}

export function normalizeProjectId(v) {
  return cleanId(v, defaultProjectId());
}

export function normalizeNodeId(v) {
  return cleanId(v, defaultNodeId());
}