export type UiPackage = {
  id: string;
  name: string;
  price: number;

  currency: string;

  discount?: string;
  features: string[];
  description?: string;
};