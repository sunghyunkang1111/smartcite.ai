import { getAccessToken } from "./auth.service";
import axios, { AxiosProgressEvent } from "axios";

const API_URL =
  (process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL_DEV) || "";

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
    console.log(error);
    throw new Error("Error fetching media presigned url");
  }
};

export const uploadFile = async (
  file: File,
  url: string,
  onProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  try {
    const response = await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: onProgress,
    });
    if (!response) throw new Error("Failed to upload file");
    return "Success";
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
