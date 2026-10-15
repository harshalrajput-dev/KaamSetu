import Service from "../models/Service.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Public: list active services (used by booking form + home page).
 */
export const listPublicServices = asyncHandler(async (_req, res) => {
  const items = await Service.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: { items } });
});

export const listServices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  const items = await Service.find(filter).sort({ name: 1 });
  res.json({ success: true, data: { items } });
});

export const createService = asyncHandler(async (req, res) => {
  const { name, labelGu, labelHi, labelEn, icon, description, isActive } = req.body;
  const exists = await Service.findOne({ name });
  if (exists) throw ApiError.conflict("Service already exists");

  const service = await Service.create({
    name,
    labelGu: labelGu || name,
    labelHi: labelHi || name,
    labelEn: labelEn || name,
    icon: icon || "wrench",
    description: description || "",
    isActive: isActive ?? true,
  });
  res.status(201).json({ success: true, data: { service } });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound("Service not found");

  const allowed = ["labelGu", "labelHi", "labelEn", "icon", "description", "isActive"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) service[key] = req.body[key];
  }
  await service.save();
  res.json({ success: true, data: { service } });
});
