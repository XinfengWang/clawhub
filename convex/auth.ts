import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";

export const BANNED_REAUTH_MESSAGE =
  "Your account has been banned for uploading malicious skills. If you believe this is a mistake, please contact security@openclaw.ai and we will work with you to restore access.";
export const DELETED_ACCOUNT_REAUTH_MESSAGE =
  "This account has been permanently deleted and cannot be restored.";

const REAUTH_BLOCKING_BAN_ACTIONS = new Set(["user.ban", "user.autoban.malware"]);

export async function handleDeletedUserSignIn(
  ctx: GenericMutationCtx<DataModel>,
  args: { userId: Id<"users">; existingUserId: Id<"users"> | null },
  userOverride?: { deletedAt?: number; deactivatedAt?: number; purgedAt?: number } | null,
) {
  const user = userOverride !== undefined ? userOverride : await ctx.db.get(args.userId);
  if (!user || (!user.deletedAt && !user.deactivatedAt)) return;

  if (args.existingUserId && args.existingUserId !== args.userId) {
    return;
  }

  if (user.deactivatedAt) {
    throw new ConvexError(DELETED_ACCOUNT_REAUTH_MESSAGE);
  }

  const userId = args.userId;
  const deletedAt = user.deletedAt ?? Date.now();
  const banRecords = await ctx.db
    .query("auditLogs")
    .withIndex("by_target", (q) => q.eq("targetType", "user").eq("targetId", userId.toString()))
    .collect();

  const hasBlockingBan = banRecords.some((record) =>
    REAUTH_BLOCKING_BAN_ACTIONS.has(record.action),
  );

  if (hasBlockingBan) {
    throw new ConvexError(BANNED_REAUTH_MESSAGE);
  }

  await ctx.db.patch(userId, {
    deletedAt: undefined,
    deactivatedAt: deletedAt,
    purgedAt: user.purgedAt ?? deletedAt,
    updatedAt: Date.now(),
  });

  throw new ConvexError(DELETED_ACCOUNT_REAUTH_MESSAGE);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string) ?? (params.email as string).split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      try {
        const user = await ctx.db.get(args.userId);
        if (user) {
          await handleDeletedUserSignIn(ctx, args, user);
        }
        await ctx.scheduler.runAfter(0, internal.publishers.ensurePersonalPublisherInternal, {
          userId: args.userId,
        });
      } catch (error) {
        // Log but don't re-throw - auth must succeed even if callbacks fail
        console.error("afterUserCreatedOrUpdated error:", error);
      }
    },
  },
});
