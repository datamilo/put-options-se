export type AnalyticsEventType =
  | 'page_view'
  | 'interaction'
  | 'filter_change'
  | 'table_action'
  | 'chart_view'
  | 'export'
  | 'error'
  | 'session_start'
  | 'session_end';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  event_name: string;
  page_path?: string;
  page_title?: string;
  event_data?: Record<string, any>;
}

export interface AnalyticsEventRecord extends AnalyticsEvent {
  id: string;
  user_id: string;
  session_id: string;
  created_at: string;
}

export interface AnalyticsSession {
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  last_activity_at: string;
  pages_visited: number;
  interactions_count: number;
  session_duration_seconds?: number;
  user_agent?: string;
  referrer?: string;
  entry_page?: string;
  exit_page?: string;
}

// Event-specific data interfaces for type safety
export interface PageViewEventData {
  referrer?: string;
  search_params?: Record<string, string>;
}

export interface FilterChangeEventData {
  filter_type: string;
  old_value: any;
  new_value: any;
  page: string;
}

export interface TableActionEventData {
  action: 'sort' | 'paginate' | 'column_toggle' | 'row_click';
  table_name: string;
  column?: string;
  sort_direction?: 'asc' | 'desc';
  page_number?: number;
}

export interface ChartViewEventData {
  chart_type: 'candlestick' | 'violin' | 'line' | 'bar' | 'scatter';
  chart_name: string;
  data_points?: number;
}

export interface ExportEventData {
  export_type: 'csv' | 'excel' | 'pdf';
  data_source: string;
  row_count?: number;
}

export interface ErrorEventData {
  error_type: 'data_load' | 'api_call' | 'render' | 'user_action';
  error_message: string;
  error_stack?: string;
  component?: string;
}

export interface InteractionEventData {
  element_type: 'button' | 'link' | 'dropdown' | 'checkbox' | 'slider' | 'input';
  element_id?: string;
  element_text?: string;
  value?: any;
}
