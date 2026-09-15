import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const registerUser = (data) => {
  return API.post("/auth/register", data);
};

export const loginUser = (data) => {
  return API.post("/auth/login", data);
};

export const getProfile = (token) => {
  return API.get("/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const logoutUser = (token) => {
  return API.post(
    "/auth/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};