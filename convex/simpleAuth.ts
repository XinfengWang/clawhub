/**
 * Simple authentication for development mode
 * Stores passwords as hash in Convex users table
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./functions";
import type { Id } from "./_generated/dataModel";
import { hashPassword, verifyPassword } from "./lib/password";
import { ensurePersonalPublisherForUser } from "./lib/publishers";

interface AuthResponse {
  userId: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Register a new user with email and password
 * Creates user in Convex with password hash
 */
export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.email || !args.password) {
      throw new ConvexError("Email and password are required");
    }

    if (args.password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new ConvexError("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user in Convex with password hash stored as custom field
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name || args.email.split("@")[0],
      displayName: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    // Store password hash separately (since it's not in the schema)
    await ctx.db.patch(userId, { passwordHash } as any);

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("Failed to create user");

    // Ensure personal publisher exists
    await ensurePersonalPublisherForUser(ctx, user);

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.image,
    } as AuthResponse;
  },
});

/**
 * Login user with email and password
 */
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.email || !args.password) {
      throw new ConvexError("Email and password are required");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    // Get password hash from user object
    const passwordHash = (user as any).passwordHash;
    if (!passwordHash) {
      throw new ConvexError("Invalid email or password");
    }

    // Verify password
    const passwordMatch = await verifyPassword(args.password, passwordHash);
    if (!passwordMatch) {
      throw new ConvexError("Invalid email or password");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.image,
    } as AuthResponse;
  },
});

/**
 * Get current user from localStorage userId (dev mode)
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return null;
  },
});

/**
 * Simple sign-in/sign-up
 */
export const simpleSignIn = mutation({
  args: {
    email: v.string(),
    password: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // User exists - attempt login
      if (args.password) {
        // Verify password
        const passwordHash = (existingUser as any).passwordHash;
        if (!passwordHash) {
          throw new ConvexError("Invalid email or password");
        }

        const passwordMatch = await verifyPassword(args.password, passwordHash);
        if (!passwordMatch) {
          throw new ConvexError("Invalid email or password");
        }

        return {
          userId: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          displayName: existingUser.displayName,
          avatarUrl: existingUser.image,
        } as AuthResponse;
      }
      // If no password provided, just return user info
      return {
        userId: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
        displayName: existingUser.displayName,
        avatarUrl: existingUser.image,
      } as AuthResponse;
    }

    // User doesn't exist - create new user
    if (!args.password) {
      throw new ConvexError("Password required for new user registration");
    }

    if (args.password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user in Convex
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name || args.email.split("@")[0],
      displayName: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    // Store password hash
    await ctx.db.patch(userId, { passwordHash } as any);

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("Failed to create user");

    // Ensure personal publisher exists
    await ensurePersonalPublisherForUser(ctx, user);

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.image,
    } as AuthResponse;
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

    // Call simpleSignIn directly with auth logic
    return await ctx.runMutation(simpleSignIn, {
      email,
      password,
      name,
    });
  },
});
