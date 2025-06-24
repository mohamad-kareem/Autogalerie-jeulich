export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;

  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) return null;
  return deviceId;
}

export function setDeviceId(id) {
  if (typeof window === "undefined") return;
  localStorage.setItem("deviceId", id);
}

export function clearDeviceId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("deviceId");
}
