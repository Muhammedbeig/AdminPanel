// app/admin/src/lib/auth/permissions.ts
import type { BlogPost, User, Role as PrismaRole } from "@prisma/client";

const SUPER_ADMIN_EMAIL = String(process.env.SUPER_ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();

export type SessionUser = {
  id: number | string;
  email: string;
  role: PrismaRole | string | null | undefined;
};

function normEmail(v: any) {
  return String(v || "").trim().toLowerCase();
}

function normRole(v: any): PrismaRole | null {
  const s = String(v || "").trim();
  if (!s) return null;

  const up = s.toUpperCase();

  // Prisma enum values
  if (
    up === "ADMIN" ||
    up === "EDITOR" ||
    up === "SEO_MANAGER" ||
    up === "CONTENT_WRITER" ||
    up === "DEVELOPER"
  ) {
    return up as PrismaRole;
  }

  return null;
}

function isSuperAdminEmail(email: string) {
  if (!SUPER_ADMIN_EMAIL) return false;
  return normEmail(email) === SUPER_ADMIN_EMAIL;
}

function sameId(a: number | string, b: number | string) {
  return String(a) === String(b);
}

export const permissions = {
  /* ---------------------------------------------------------------------- */
  /* SYSTEM LEVEL                                                            */
  /* ---------------------------------------------------------------------- */

  isSuperAdmin(user: SessionUser) {
    return isSuperAdminEmail(user.email);
  },

  canManageUsers(user: SessionUser) {
    if (isSuperAdminEmail(user.email)) return true;
    return normRole(user.role) === "ADMIN";
  },

  canModifyUser(actor: SessionUser, targetUser: User) {
    // nobody can modify super admin record
    if (isSuperAdminEmail(targetUser.email)) return false;
    return normRole(actor.role) === "ADMIN";
  },

  /* ---------------------------------------------------------------------- */
  /* BLOG CONTENT LEVEL                                                      */
  /* ---------------------------------------------------------------------- */

  canCreatePost(user: SessionUser) {
    const r = normRole(user.role);
    return r === "ADMIN" || r === "CONTENT_WRITER";
  },

  canEditPost(user: SessionUser, post: BlogPost) {
    if (isSuperAdminEmail(user.email)) return true;

    const r = normRole(user.role);

    // Admin/Editor/SEO can edit all
    if (r === "ADMIN" || r === "EDITOR" || r === "SEO_MANAGER") return true;

    // Developer is read-only for content
    if (r === "DEVELOPER") return false;

    // Writers can edit their own posts only
    if (r === "CONTENT_WRITER") return sameId(post.authorId as any, user.id);

    return false;
  },

  canPublishPost(user: SessionUser) {
    if (isSuperAdminEmail(user.email)) return true;

    const r = normRole(user.role);
    return r === "ADMIN" || r === "EDITOR" || r === "SEO_MANAGER";
  },

  canDeletePost(user: SessionUser, post: BlogPost) {
    if (isSuperAdminEmail(user.email)) return true;

    const r = normRole(user.role);

    if (r === "ADMIN" || r === "EDITOR") return true;

    // Writers: only delete own drafts
    if (r === "CONTENT_WRITER") {
      return sameId(post.authorId as any, user.id) && !post.isPublished;
    }

    return false;
  },

  canPermanentlyDelete(user: SessionUser) {
    if (isSuperAdminEmail(user.email)) return true;

    const r = normRole(user.role);

    if (r === "CONTENT_WRITER" || r === "DEVELOPER") return false;
    return r === "ADMIN" || r === "EDITOR";
  },
};
