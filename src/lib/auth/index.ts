export { ConditionalClerkProvider, isClerkConfigured } from "./clerk-provider";

// Server-only exports should be imported from "./org-membership" directly
// to avoid bundling server code in client components
export type { AuthResult, AuthError, MemberRole } from "./org-membership";
