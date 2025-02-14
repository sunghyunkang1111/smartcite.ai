import axios from "axios";
import { getAccessToken } from "./auth.service";
import { IDocument } from "../types/types";

const API_URL =
  (process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL_DEV) || "";

export const createCase = async (
  title: string,
  client: string,
  clientRole: string,
  assignedLawyers: string,
  state: string
) => {
  try {
    const response = await axios.post(
      `${API_URL}/cases`,
      {
        title: title,
        client: client,
        clientRole: clientRole,
        assignedLawyers: assignedLawyers,
        state: state,
      },
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );

    return response.data as IDocument;
  } catch (error) {
    throw new Error("Failed to create case");
  }
};
