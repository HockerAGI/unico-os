// src/lib/authz.js
"use strict";

/**
 * RBAC UnicOs (roles -> módulos visibles)
 * Nota: módulos alineados a PDF (Dashboard, Pedidos, Productos, Clientes, Marketing, Usuarios, Integraciones)
 */
export const ROLE_PERMS = {
  owner: ["dashboard", "orders", "shipping", "products", "crm", "marketing", "users", "integrations"],
  admin: ["dashboard", "orders", "shipping", "products", "crm", "marketing", "users", "integrations"],
  ops: ["orders", "shipping", "products"],
  sales: ["orders", "crm", "shipping"],
  marketing: ["dashboard", "products", "marketing"],
  viewer: ["dashboard"],
};

export const hasPerm = (role, module) => {
  if (!role) return false;
  const r = String(role).toLowerCase().trim();
  return ROLE_PERMS[r]?.includes(module) || false;
};

export const canManageUsers = (role) => {
  if (!role) return false;
  const r = String(role).toLowerCase().trim();
  return ["owner", "admin"].includes(r);
};

export const canRefund = (role) => {
  if (!role) return false;
  const r = String(role).toLowerCase().trim();
  return ["owner", "admin"].includes(r);
};