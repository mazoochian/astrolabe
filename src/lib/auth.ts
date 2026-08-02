import { verifySessionToken } from "~/lib/session";
import { getUserStore, type User } from "~/lib/user-store";

export function authenticateUser(email: string, password: string): User | null {
  return getUserStore().authenticate(email, password);
}

export function getUserFromSession(token: string): User | null {
  const session = verifySessionToken(token);
  if (!session) return null;

  const user = getUserStore().findById(session.userId);
  if (!user || user.email !== session.email) return null;
  return user;
}
