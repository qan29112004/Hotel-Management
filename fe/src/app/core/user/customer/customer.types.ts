export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'password'
    | 'date' | 'datetime-local'
    | 'checkbox' | 'radio' | 'select' | 'multiselect'
    | 'file';

export interface SectionConfig {
    section: any;
    title: string;
    fields: FieldConfig[];
}

export interface SectionResponse {
    id: number;
    name: string;
    description: string;
    section: any;
    created_at: string;
    updated_at: string;
}

export interface FieldConfig {
    id: number;
    name: string;
    label: string;
    data_type: string;
    type: FieldType;
    placeholder: string;
    table_id: number;
    field_type: string;
    section?: number;
    section_id: number;
    config?: {
        required?: boolean;
        related_model?: string;
        content_type_id?: number;
        max_length?: number;
    }
    relation_info?: {
        relation_type?: string;
        relation_target?: string;
        model?: string;
        content_type_id?: number;
        display_field?: string;
    }
    show_field_options?: boolean;
    value?: any;
}

export interface FieldResponse {
    type: string;
    code: string;
    message: string;
    data: FieldConfig[]
}

export interface FormTemplate {
    id: number;
    name: string;
    description: string;
    type: string;
    version: number;
    created_at: string;
    updated_at: string;
    sections: SectionResponse[];
    fields: FieldConfig[];
    records?: any[];
}

export interface FormTemplateRequest {
    section: any;
    title: string;
    description: string;
    fields: number[];
}

export interface RecordData {
    id: number;
    email: string;
    source: string;
    status: string;
    assigned_to: string;
    phone_number: string;
    customer_name: string;
}

export interface RecordItem {
    id: number;
    data: RecordData;
    created_at: string;
    updated_at: string;
    table: number;
}

export interface CustomerResponse {
    type: string;
    code: string;
    message: string;
    data: {
        records: RecordItem[];
        total_records: number;
        all_records: number;
    };
}

export interface CustomerListPayload {
    page_index: number;
    page_size: number;
    filter_rules: any[];
    search_rule: any;
    sort_rule: any;
}
export interface FilterRule {
  field: string;
  option: 'in' | 'range' | 'eq' | 'contains' | string;
  value: any[];
}

export interface ListPayload {
  page_index: number;
  filter_rules?: FilterRule[];
  search_rule?: any;
  sort_rule?: any;
}