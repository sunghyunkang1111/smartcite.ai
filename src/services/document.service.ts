import axios from "axios";
import { getAccessToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use environment variables for base URL

export const createDocument = async (
  caseId: string,
  mediaId: string,
  title: string
) => {
  const response = await axios.post(
    `${API_URL}/cases/${caseId}/documents`,
    { title, mediaId },
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  return response.data as DocumentResponseDto;
};
export interface DocumentResponseDto {
  id: string;
  title: string;
  mediaId: string;
  mediaUrl: string;
  createdAt: string;
  processingStatus: string;
  citationsExtractionStatus: string | null;
  citationsCount: number;
}
