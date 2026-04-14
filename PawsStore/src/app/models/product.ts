export type ProductCategory = 'food' | 'toy' | 'accessory' | 'beds' | 'furniture';

/**
 * Технические спецификации товара
 */
export interface ProductSpecifications {
  size: string;
  weight: string;
  material?: string;
  color?: string;
  [key: string]: string | number | boolean | undefined; // Дополнительные поля
}


export interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];  /** Массив изображений для карусели */
  shortDescription: string;
  fullDescription: string;
  highlights: string[];  /** Ключевые особенности (буллеты для раздела "Key Highlights") */
  specifications: ProductSpecifications;  /** Технические характеристики для таблицы спецификаций */
  category: ProductCategory;
}

/**
 * Интерфейс ответа от JSON файла с данными
 */
export interface ProductsData {
  products: Product[];
}