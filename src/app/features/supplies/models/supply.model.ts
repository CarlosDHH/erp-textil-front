export interface Supply {
  id?: string;
  code: string;
  name: string;
  type: string;
  unitMeasure: string;
  minStock: number;
  currentStock: number;
  durationDays?: number;
  isActive?: boolean;
  createdAt?: string;
}