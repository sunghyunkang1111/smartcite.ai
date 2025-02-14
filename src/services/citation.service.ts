import axios from "axios";
import { getAccessToken } from "./auth.service";
import { ICitation } from "../types/types";

const API_URL =
  (process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL_DEV) || "";

export const getCitations = async (documentId: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/documents/${documentId}/citations`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data as ICitation[];
  } catch (error) {
    console.error("Error fetching citations:", error);
    throw error; // Re-throw the error to handle it in the component
  }
};
