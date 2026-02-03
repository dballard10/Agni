/**
 * String manipulation utilities
 */

/**
 * Get initials from a name (up to 2 characters)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
