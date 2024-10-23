export interface DocumentResponseDto {
  id: string;
  title: string;
  mediaId: string;
  mainDocumentId: string;
  type: string;
  mediaUrl: string;
  createdAt: string;
  processingStatus: string;
  citationsExtractionStatus: string | null;
  citationsCount: number;
}

export interface CitationResponseDto {
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
  sourceText: number;
  referencedText: string;
}
