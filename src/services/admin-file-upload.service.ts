import { getAccessToken } from "./auth.service";
import axios, { AxiosProgressEvent } from "axios";

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

export const uploadFile = async (
  file: File,
  url: string,
  onProgress: (progressEvent: AxiosProgressEvent) => void,
  onCancel: (cancelUpload: () => void) => void
) => {
  const controller = new AbortController()
  onCancel(() => controller.abort());
  try {
    await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: onProgress,
      signal: controller.signal,
    });
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log('Upload cancelled');
    } else {
      console.error(err);
      throw new Error("Error uploading file");
    }
  }
};

export interface MediaResponseDto {
  id: string;
  mediaUrl: string;
  uploadMethod: string;
  uploadUrl: string;
  fields: any;
}
