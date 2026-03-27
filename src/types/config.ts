export interface EventConfig {
  EVENT_NAME: string;
  EVENT_DATE: string;
  EVENT_LOCATION: string;
  YT_URL: string;
  ADMIN_PIN: string;
}

export type ConfigKey = keyof EventConfig;
