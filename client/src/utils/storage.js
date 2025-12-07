export const getAccessToken = () => localStorage.getItem("jwt");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setAccessToken = (token) => localStorage.setItem("jwt", token);
export const setRefreshToken = (token) => localStorage.setItem("refreshToken", token);

export const clearStorage = () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("refreshToken");
};
