import { BASE_URL } from "../Config";

export function resolveMediaUrl(filePath) {
  if (filePath === undefined || filePath === null) return "";
  const trimmed = String(filePath).trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanBase = String(BASE_URL || "").replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (cleanBase && cleanPath.startsWith(`${cleanBase}/`)) {
    return cleanPath;
  }
  return `${cleanBase}${cleanPath}`;
}

export function isImageFile(filePath) {
  if (!filePath) return false;
  return /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg)(\?.*)?$/i.test(String(filePath).trim());
}

export function isPdfFile(filePath) {
  if (!filePath) return false;
  return /\.pdf(\?.*)?$/i.test(String(filePath).trim());
}

export function getUploadedDocSummary(vehicleDetail) {
  if (!vehicleDetail) {
    return { uploaded: 0, total: 3, missing: ["RC / Vehicle Doc", "Insurance", "Driving Licence"] };
  }
  const checks = [
    { label: "RC / Vehicle Doc", value: resolveMediaUrl(vehicleDetail.vehicleDocument) },
    { label: "Insurance", value: resolveMediaUrl(vehicleDetail.insurance) },
    { label: "Driving Licence", value: resolveMediaUrl(vehicleDetail.drivingLicence) },
  ];
  const uploaded = checks.filter((c) => Boolean(c.value)).length;
  const missing = checks.filter((c) => !c.value).map((c) => c.label);
  return { uploaded, total: checks.length, missing };
}
