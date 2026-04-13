import axios from "axios";

export const devURL = "http://localhost:4000/api/v1";
export const prodURL = "https://grid-manager-server.vercel.app/api/v1";

export const axiosInstance = axios.create({
  baseURL: devURL,
});
