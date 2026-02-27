"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultNodeId, defaultProjectId, normalizeNodeId, normalizeProjectId } from "@/lib/project";

type WorkspaceState = {
  projectId: string;
  nodeId: string;
  tutorial: boolean;
  setProjectId: (v: string) => void;
  setNodeId: (v: string) => void;
  setTutorial: (v: boolean) => void;
  reset: () => void;
};

const Ctx = createContext<WorkspaceState | null>(null);

const LS_PROJECT = "hocker.workspace.projectId";
const LS_NODE = "hocker.workspace.nodeId";
const LS_TUTORIAL = "hocker.workspace.tutorial";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const defaults = useMemo(
    () => ({
      projectId: normalizeProjectId(defaultProjectId()),
      nodeId: normalizeNodeId(defaultNodeId()),
      tutorial: false,
    }),
    []
  );

  const [projectId, _setProjectId] = useState(defaults.projectId);
  const [nodeId, _setNodeId] = useState(defaults.nodeId);
  const [tutorial, _setTutorial] = useState(defaults.tutorial);

  useEffect(() => {
    try {
      const p = localStorage.getItem(LS_PROJECT);
      const n = localStorage.getItem(LS_NODE);
      const t = localStorage.getItem(LS_TUTORIAL);

      if (p) _setProjectId(normalizeProjectId(p));
      if (n) _setNodeId(normalizeNodeId(n));
      if (t === "1" || t === "0") _setTutorial(t === "1");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProjectId = useCallback((v: string) => {
    const nv = normalizeProjectId(v);
    _setProjectId(nv);
    try {
      localStorage.setItem(LS_PROJECT, nv);
    } catch {}
  }, []);

  const setNodeId = useCallback((v: string) => {
    const nv = normalizeNodeId(v);
    _setNodeId(nv);
    try {
      localStorage.setItem(LS_NODE, nv);
    } catch {}
  }, []);

  const setTutorial = useCallback((v: boolean) => {
    const nv = !!v;
    _setTutorial(nv);
    try {
      localStorage.setItem(LS_TUTORIAL, nv ? "1" : "0");
    } catch {}
  }, []);

  const reset = useCallback(() => {
    setProjectId(defaults.projectId);
    setNodeId(defaults.nodeId);
    setTutorial(false);
  }, [defaults.nodeId, defaults.projectId, setNodeId, setProjectId, setTutorial]);

  const value: WorkspaceState = {
    projectId,
    nodeId,
    tutorial,
    setProjectId,
    setNodeId,
    setTutorial,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace() debe usarse dentro de <WorkspaceProvider/>");
  return v;
}