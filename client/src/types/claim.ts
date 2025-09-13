export type ClaimStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTING'
  | 'NEGOTIATING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELLED';

export type Jurisdiction = 'EU_261' | 'ISRAEL_ASL' | 'OTHER';

export type DocumentType = 
  | 'BOARDING_PASS'
  | 'RECEIPT'
  | 'PASSPORT'
  | 'ID'
  | 'OTHER';

export interface ClaimFormData {
  // Flight details
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  
  // Passenger details
  passengerFirstName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone?: string;
  passengerAddress?: string;
  passengerCountry?: string;
  
  // Banking details
  iban?: string;
  
  // Claim details
  jurisdiction?: Jurisdiction;
  euCompensationAmount?: number;
  israelCompensationAmount?: number;
  finalCompensationAmount?: number;
  
  // Additional info
  incidentDescription?: string;
  assistanceReceived?: boolean;
}

export interface Document {
  id: string;
  claimId: string;
  type: DocumentType;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
}

export interface ClaimTimeline {
  id: string;
  claimId: string;
  status: ClaimStatus;
  description?: string;
  metadata?: any;
  createdAt: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  userId: string;
  flightId?: string;
  
  // Flight details
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  
  // Passenger details
  passengerFirstName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone?: string;
  passengerAddress?: string;
  passengerCountry?: string;
  
  // Banking details
  iban?: string;
  
  // Claim details
  status: ClaimStatus;
  jurisdiction?: Jurisdiction;
  euCompensationAmount?: number;
  israelCompensationAmount?: number;
  finalCompensationAmount?: number;
  
  // Additional info
  incidentDescription?: string;
  assistanceReceived?: boolean;
  
  // Timestamps
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  documents?: Document[];
  timeline?: ClaimTimeline[];
}
