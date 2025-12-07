export enum Category {
  PETISCOS = 'Petiscos',
  LANCHES = 'Lanches',
  BEBIDAS = 'Bebidas',
  REFEICOES = 'Refeições',
  SOBREMESAS = 'Sobremesas'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  items: CartItem[];
  total: number;
  customerName: string;
  tableNumber?: string;
}

export interface AppSettings {
  whatsappNumber: string;
  shareUrl: string;
}