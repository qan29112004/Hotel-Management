export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'password'
    | 'date' | 'datetime-local'
    | 'checkbox' | 'radio' | 'select' | 'multiselect'
    | 'file';

export interface SectionConfig {
    id?: number;
    title: string;
    description?: string;
    section: any;
    fields: FieldConfig[];
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
    ordering?: number;
    show_field_options?: boolean;
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
    sections?: SectionConfig[];
    template_type?: string;
    type?: string;
    version?: number;
    created_at?: string;
    updated_at?: string;
}

export interface FormResponse {
    type: string;
    code: string;
    message: string;
    data: {
        tables: FormTemplate[];
        total_tables: number;
        all_tables: number;
    }
}

export interface FormTemplateResponse {
    type: string;
    code: string;
    message: string;
    data: FormTemplate[];
}

export interface FormTemplateRequest {
    section: any;
    title: string;
    description: string;
    fields: {
        id: number;
        name: string;
        ordering: number;
    }[];
}