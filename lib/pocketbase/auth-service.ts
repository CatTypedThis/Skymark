import type PocketBase from "pocketbase";
import { isPocketBaseNetworkError, pocketBaseUrl } from "./client";

export interface AuthUser {
  id: string;
  email: string;
}

export function currentAuthUser(pb: PocketBase): AuthUser | null {
  const model = pb.authStore.record;
  if (!pb.authStore.isValid || !model) {
    return null;
  }

  return {
    id: model.id,
    email: String(model.email ?? ""),
  };
}

export async function signInWithEmail(pb: PocketBase, email: string, password: string): Promise<AuthUser> {
  try {
    await pb.collection("users").authWithPassword(email, password);
    const user = currentAuthUser(pb);
    if (!user) {
      throw new Error("Sign-in completed without an active user.");
    }
    return user;
  } catch (error) {
    throw new Error(formatPocketBaseError(error, "Sign-in failed."));
  }
}

export async function signUpWithEmail(pb: PocketBase, email: string, password: string): Promise<AuthUser> {
  try {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
    });
  } catch (error) {
    throw new Error(formatPocketBaseError(error, "Account creation failed."));
  }

  return signInWithEmail(pb, email, password);
}

export function signOut(pb: PocketBase) {
  pb.authStore.clear();
}

type PocketBaseErrorLike = {
  status?: number;
  message?: string;
  response?: {
    message?: string;
    data?: Record<string, { message?: string }>;
  };
};

export function formatPocketBaseError(error: unknown, fallback: string): string {
  const backendUrl = pocketBaseUrl();

  if (isPocketBaseNetworkError(error)) {
    return `PocketBase is not reachable at ${backendUrl}. Start the PocketBase server and try again.`;
  }

  if (error && typeof error === "object") {
    const pbError = error as PocketBaseErrorLike;
    const fieldMessages = pbError.response?.data
      ? Object.values(pbError.response.data)
          .map((field) => field.message)
          .filter(Boolean)
      : [];

    if (fieldMessages.length > 0) {
      return fieldMessages.join(" ");
    }

    if (pbError.response?.message) {
      return pbError.response.message;
    }

    if (pbError.status === 400) {
      return `${fallback} Check the email and password requirements.`;
    }

    if (pbError.status === 401) {
      return "Email or password is incorrect.";
    }

    if (pbError.status === 404) {
      return `PocketBase is reachable, but the expected collection is missing at ${backendUrl}. Apply the backend migrations.`;
    }

    if (pbError.message && pbError.message !== "Something went wrong.") {
      return pbError.message;
    }
  }

  return `${fallback} PocketBase returned an unexpected error.`;
}
