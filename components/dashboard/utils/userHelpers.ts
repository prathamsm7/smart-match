/**
 * Helper functions for user data formatting
 */

export function getUserInitials(user: any): string {
  if (user?.user_metadata?.full_name) {
    const names = user.user_metadata.full_name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  if (user?.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return "U";
}

export function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
}

export function getUserTitle(): string {
  return "Full Stack Dev"; // This can be dynamic later
}

