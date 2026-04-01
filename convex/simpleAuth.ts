/**
 * Simple authentication for development mode
 * Allows any email/password combination to create or login to an account
 */

import { v } from "convex/values";
import { mutation, query } from "./functions";
import type { Id } from "./_generated/dataModel";

/**
 * Simple sign-in/sign-up that creates a user if they don't exist
 * In dev mode, any email/password combination works
 */
export const simpleSignIn = mutation({
  args: {
    email: v.string(),
    password: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // User exists - return their ID (in dev mode, password is ignored)
      return {
        userId: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name || args.email.split("@")[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId,
      email: args.email,
      name: args.name || args.email.split("@")[0],
    };
  },
});

/**
 * Get current user (dev mode - always returns a dummy user for now)
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // In dev mode, return a dummy user
    // In production, this would check auth context
    return null;
  },
});

/**
 * Stub function that matches Convex Auth API
 */
export const signIn = mutation({
  args: {
    provider: v.string(),
    formData: v.any(),
  },
  handler: async (ctx, args) => {
    // Extract email and password from FormData
    const formDataObj = args.formData;
    const email = formDataObj?.email || "dev@example.com";
    const password = formDataObj?.password || "";
    const name = formDataObj?.name;
    const flow = formDataObj?.flow || "signIn";

    // Just call simpleSignIn
    return await ctx.runMutation("simpleSignIn", {
      email,
      password,
      name,
    });
  },
});
