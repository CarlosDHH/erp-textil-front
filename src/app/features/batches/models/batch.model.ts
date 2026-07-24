export interface Batch {
  id: string;
  batchNumber: string;
  supplyId: string;
  supplierId: string;
  initialQuantity: number;
  currentQuantity: number;
  color: string;
  materialType?: string;
  warehouseLocation: string;
  entryDate: string;
  notes?: string;
  season?: string;
  toneRange?: string;
  /** Nombre del proveedor resuelto por el backend (relación). */
  supplierName?: string;
  /** Nombre del insumo resuelto por el backend (relación). */
  supplyName?: string;
  createdAt?: string;
}
