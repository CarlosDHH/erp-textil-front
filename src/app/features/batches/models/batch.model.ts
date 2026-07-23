export interface Batch {
  id: number;
  batchNumber: string;
  supplyId: number;
  supplierId: number;
  initialQuantity: number;
  currentQuantity: number;
  color: string;
  warehouseLocation: string;
  entryDate: string;
  createdAt?: string;
}