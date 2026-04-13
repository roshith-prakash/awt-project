import axios from "axios";

export const devURL = "http://localhost:4000/api/v1";

export const axiosInstance = axios.create({
  baseURL: devURL,
});
