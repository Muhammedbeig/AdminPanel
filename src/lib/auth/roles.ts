import { Role } from "@prisma/client";

export { Role };

export const ALL_ROLES: Role[] = [
  Role.ADMIN,
  Role.EDITOR,
  Role.SEO_MANAGER,
  Role.CONTENT_WRITER,
  Role.DEVELOPER,
];

export function parseRole(input: unknown): Role | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toUpperCase();

  switch (normalized) {
    case "ADMIN":
      return Role.ADMIN;
    case "EDITOR":
      return Role.EDITOR;
    case "SEO_MANAGER":
    case "SEO MANAGER":
    case "SEO-MANAGER":
      return Role.SEO_MANAGER;
    case "CONTENT_WRITER":
    case "CONTENT WRITER":
    case "CONTENT-WRITER":
      return Role.CONTENT_WRITER;
    case "DEVELOPER":
      return Role.DEVELOPER;
    default:
      return null;
  }
}
