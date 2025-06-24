const DEVICE_ID_KEY = "autogalerie_device_id";

export const getDeviceId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_ID_KEY);
};

export const setDeviceId = (id) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_ID_KEY, id);
};

export const clearDeviceId = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEVICE_ID_KEY);
};
