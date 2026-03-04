export interface ColorVariant {
  name: string;
  hexCode: string;
  images: string[];
  inStock: boolean;
  translations?: {
    en?: string;
    ru?: string;
  };
}

export interface Product {
  id: number;
  name: string;
  translations?: {
    en?: {
      name?: string;
      description?: string;
      features?: string[];
      materials?: string[];
    };
    ru?: {
      name?: string;
      description?: string;
      features?: string[];
      materials?: string[];
    };
  };
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  materials: string[];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  colors: string[];
  colorVariants?: ColorVariant[];
  inStock: boolean;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestseller?: boolean;
  // Caracteristici specifice pentru diferite tipuri de produse
  specificFeatures?: {
    // Pentru canapele/fotolii
    seatingCapacity?: number;
    hasSleepFunction?: boolean;
    hasStorage?: boolean;
    // Pentru paturi
    mattressIncluded?: boolean;
    bedSize?: string;
    hasHeadboard?: boolean;
    // Pentru dulapuri/dressing-uri
    numberOfDoors?: number;
    numberOfDrawers?: number;
    hasMirror?: boolean;
    // Pentru mese
    isExtendable?: boolean;
    maxSeatingCapacity?: number;
    tableShape?: string;
    // Pentru birouri
    hasDrawers?: boolean;
    hasCableManagement?: boolean;
    adjustableHeight?: boolean;
    // Pentru rafturi/biblioteci
    numberOfShelves?: number;
    adjustableShelves?: boolean;
    maxLoadPerShelf?: number;
  };
}

export const products: Product[] = [];
