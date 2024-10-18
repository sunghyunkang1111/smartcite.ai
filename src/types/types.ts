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
