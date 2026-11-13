import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";

export async function getCompanyStampId() {
  await connectDB();
  const setting = await AppSetting.findById("companyStamp").select("value").lean();
  if (typeof setting?.value !== "string") return "";
  if (setting.value.startsWith("data:image/webp;base64,")) return setting.value;
  // Support the current upload from the earlier storage format.
  if (/^[a-f0-9]{64}$/.test(setting.value)) {
    const image = await AppSetting.findById("companyStamp:" + setting.value).select("value").lean();
    return image?.value ? "data:image/webp;base64," + image.value : "";
  }
  return "";
}

export async function saveCompanyStamp(image, user) {
  await connectDB();
  const value = "data:image/webp;base64," + image.toString("base64");
  await AppSetting.updateOne({ _id: "companyStamp" }, { $set: { value, updatedBy: user } }, { upsert: true });
  await AppSetting.deleteMany({ _id: /^companyStamp:[a-f0-9]{64}$/ });
  return value;
}

export async function removeCompanyStamp(user) {
  await connectDB();
  await AppSetting.updateOne({ _id: "companyStamp" }, { $set: { value: null, updatedBy: user } });
  await AppSetting.deleteMany({ _id: /^companyStamp:[a-f0-9]{64}$/ });
}
