export interface IDocument {
  id: string;
  title: string;
  mediaId: string;
  userId: string;
  mainDocumentId: string;
  caseId: string;
  type: string;
  mediaUrl: string;
  createdAt: string;
  processingStatus: string;
  citationsExtractionStatus: string | null;
  citationsCount: number;
}

export interface ICitation {
  id: string;
  sourceDocumentId: string;
  sourcePageNumber: number | null;
  sourceRectangleX1: number | null;
  sourceRectangleY1: number | null;
  sourceRectangleX2: number | null;
  sourceRectangleY2: number | null;
  destinationDocumentId: string;
  destinationPageNumber: number | null;
  createdAt: string;
  creationSource: string;
  sourceText: string;
  referencedText: string;
}

export interface ICase {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  uploadedDocumentsCount: number;
  citationsCount: number;
  client: string;
  clientRole: string;
  assignedLawyers: string;
  state: string;
}
export interface IApiKey {
  id: string;
  name: string;
  key: string;
  lastUsedAt: string;
  createdAt: string;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

