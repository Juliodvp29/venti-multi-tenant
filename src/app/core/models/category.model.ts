import { BaseModel } from './index';

export interface Category extends BaseModel {
    tenant_id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    sort_order: number;
    image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    is_active: boolean;
    children?: Category[];
}

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    image_url?: string;
    meta_title?: string;
    meta_description?: string;
    is_active?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }
