export interface Equipment {
  equipmentId: string;
  tenantId: string;
  name: string;
  serialNumber?: string;
  qr?: string;
  brand?: string;
  price?: number;
  purchaseDate?: Date;
  isOnRent: boolean;
  perDayRent?: number;
  image?: string;
  condition?: number; // Points out of 5
  createdAt?: Date;
  updatedAt?: Date;
}
