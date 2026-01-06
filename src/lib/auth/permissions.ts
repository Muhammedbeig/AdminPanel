import type { BlogPost, User } from "@prisma/client";

export enum Role {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  SEO_MANAGER = "SEO_MANAGER",
  CONTENT_WRITER = "CONTENT_WRITER",
  DEVELOPER = "DEVELOPER"
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

type SessionUser = {
  id: number | string;
  email: string;
  role: Role;
};

export const permissions = {
  // --- SYSTEM LEVEL ---
  
  isSuperAdmin: (user: SessionUser) => {
    return !!SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL;
  },

  canManageUsers: (user: SessionUser) => {
    return user.role === Role.ADMIN || (!!SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL);
  },

  canModifyUser: (actor: SessionUser, targetUser: User) => {
    if (!!SUPER_ADMIN_EMAIL && targetUser.email === SUPER_ADMIN_EMAIL) return false;
    if (actor.role === Role.ADMIN) return true;
    return false;
  },

  // --- BLOG CONTENT LEVEL ---

  canCreatePost: (user: SessionUser) => {
    // ✅ RULE: Editor & SEO Manager cannot create. Developer cannot create.
    // Only Admin and Content Writers can create.
    const allowed = [Role.ADMIN, Role.CONTENT_WRITER];
    return allowed.includes(user.role as Role);
  },

  canEditPost: (user: SessionUser, post: BlogPost) => {
    if (!!SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL) return true;
    
    // ✅ RULE: Editor & SEO Manager can edit.
    if (user.role === Role.ADMIN || user.role === Role.EDITOR || user.role === Role.SEO_MANAGER) return true;

    // Developer: Read-Only (Cannot edit content)
    if (user.role === Role.DEVELOPER) return false;

    // Writers: Own posts only
    if (user.role === Role.CONTENT_WRITER) {
      // eslint-disable-next-line eqeqeq
      return post.authorId == user.id;
    }
    return false;
  },

  canPublishPost: (user: SessionUser) => {
    // Writers & Developers cannot publish
    const allowed = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER];
    return allowed.includes(user.role as Role);
  },

  canDeletePost: (user: SessionUser, post: BlogPost) => {
    if (!!SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL) return true;
    // Editor allowed to delete? (Prompt said "can edit anything", usually implies delete too, but definitely no add)
    if (user.role === Role.ADMIN || user.role === Role.EDITOR) return true;

    // Writers: Only own DRAFTS
    if (user.role === Role.CONTENT_WRITER) {
      // eslint-disable-next-line eqeqeq
      return post.authorId == user.id && !post.isPublished;
    }
    return false;
  },

  canPermanentlyDelete: (user: SessionUser) => {
    // Strict safety
    if (user.role === Role.CONTENT_WRITER || user.role === Role.DEVELOPER) return false;
    return (user.role === Role.ADMIN || user.role === Role.EDITOR) || (!!SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL);
  }
};