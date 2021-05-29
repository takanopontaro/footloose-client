export type ILogData = {
  data: string;
  level?: 'info' | 'warn' | 'error';
  className?: string;
  attributes?: Record<string, string>;
};

export type ILog = ILogData & {
  id: string;
};

export type ILogFilter = (logData: ILogData) => boolean;

export type ILogSettings = {
  filter: ILogFilter;
};
