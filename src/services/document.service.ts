import axios from "axios";
import { getAccessToken } from "./auth.service";
import { DocumentResponseDto } from "../types/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use environment variables for base URL

export const createDocument = async (
  caseId: string,
  mediaId: string,
  title: string,
  type: string,
  mainDocumentId: string
) => {
  const response = await axios.post(
    `${API_URL}/cases/${caseId}/documents`,
    {
      title: title,
      mediaId: mediaId,
      mainDocumentId: mainDocumentId,
      type: type,
    },
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  return response.data as DocumentResponseDto;
};
