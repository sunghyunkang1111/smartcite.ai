import axios from "axios";
import { getAccessToken } from "./auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Use environment variables for base URL

export const getMediaPresignedUrl = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/media-presigned-url`,
      { use: "DOCUMENT" },
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data as MediaResponseDto;
  } catch (error) {
    throw new Error("Error fetching media presigned url");
  }
};

export const uploadFile = async (file: File, url: string) => {
  try {
    await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Error uploading file");
  }
};

export interface MediaResponseDto {
  id: string;
  mediaUrl: string;
  uploadMethod: string;
  uploadUrl: string;
  fields: any;
}
