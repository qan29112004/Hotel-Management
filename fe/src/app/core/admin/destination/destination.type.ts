export interface Destination {
  uuid: string;
  name: string;
  thumbnail?:string;
  selected?:boolean;
  description: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface DestinationResponse {
  data: Destination[];
  total?: number;
  page?: number;
  page_size?: number;
}

export interface DestinationCreateRequest {
  name: string;
  description: string;
}

export interface DestinationUpdateRequest {
  name?: string;
  description?: string;
}

export interface FieldConfig {
    name: string;
    labelKey: string;
    type: 'text' | 'email' | 'select' | 'date' | 'radio' | 'number' | 'password' | 'file' | 'files' | 'checkbox' | 'textarea' | 'country'; // Thêm 'file' và 'files'
    required?: boolean;
    disabled?: boolean;
    validators?: any[];
    options?: { id: string | number | boolean; name: string }[];
    placeholderKey?: string;
    errorMessages?: { [key: string]: string };
    accept?: string; // Optional: Để giới hạn loại file, ví dụ: 'image/*' hoặc '.pdf'
    asyncOptionsKey?:any,
    isForeignKey?:boolean;
    relatedName?:string;
    helpText?:string
}