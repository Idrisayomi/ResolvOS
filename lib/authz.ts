type Metadata = {
  role?: unknown;
  roles?: unknown;
};

const AGENT_ROLE = 'customer_service_agent';

function roleList(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  return [];
}

export function hasCustomerServiceAgentRole(input: {
  app_metadata?: unknown;
  user_metadata?: unknown;
}): boolean {
  const appMetadata =
    input.app_metadata && typeof input.app_metadata === 'object'
      ? (input.app_metadata as Metadata)
      : undefined;
  const userMetadata =
    input.user_metadata && typeof input.user_metadata === 'object'
      ? (input.user_metadata as Metadata)
      : undefined;

  const roles = [
    ...roleList(appMetadata?.role),
    ...roleList(appMetadata?.roles),
    ...roleList(userMetadata?.role),
    ...roleList(userMetadata?.roles),
  ];

  return roles.includes(AGENT_ROLE);
}

export const CUSTOMER_SERVICE_AGENT_ROLE = AGENT_ROLE;
