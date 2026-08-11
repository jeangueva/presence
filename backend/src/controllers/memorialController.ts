import type { Request, Response } from "express";
import {
  createMemorialSchema,
  togglePublicSchema,
  updateMemorialSchema,
} from "../schemas/memorial.js";
import {
  approveGuestbookEntry,
  createFromVault,
  deleteGuestbookEntry,
  deleteMemorial,
  deleteMemorialPhotoRecord,
  getMemorialPhoto,
  getOwnedMemorial,
  listGuestbookForOwner,
  listMemorialPhotos,
  listMyMemorials,
  recordMemorialPhoto,
  togglePublic,
  updateMemorial,
} from "../services/memorialService.js";
import {
  deleteStorageObject,
  uploadMemorialPhoto,
  uploadObject,
} from "../services/storageService.js";
import { enforceCanCreateMemorial } from "../services/entitlementsService.js";
import { supabase } from "../config/supabase.js";
import { badRequest, unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const list = async (req: Request, res: Response) => {
  const user = getUser(req);
  const memorials = await listMyMemorials(user.id);
  res.json({ memorials });
};

export const create = async (req: Request, res: Response) => {
  const user = getUser(req);
  await enforceCanCreateMemorial(user.id);
  const { vault_id } = createMemorialSchema.parse(req.body);
  const memorial = await createFromVault(user.id, vault_id);
  res.status(201).json(memorial);
};

export const detail = async (req: Request, res: Response) => {
  const user = getUser(req);
  const memorial = await getOwnedMemorial(req.params.id, user.id);
  res.json(memorial);
};

export const update = async (req: Request, res: Response) => {
  const user = getUser(req);
  const patch = updateMemorialSchema.parse(req.body);
  const memorial = await updateMemorial(req.params.id, user.id, patch);
  res.json(memorial);
};

export const remove = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deleteMemorial(req.params.id, user.id);
  res.status(204).send();
};

export const toggle = async (req: Request, res: Response) => {
  const user = getUser(req);
  const { public: isPublic } = togglePublicSchema.parse(req.body);
  const memorial = await togglePublic(req.params.id, user.id, isPublic);
  res.json(memorial);
};

export const photos = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  const items = await listMemorialPhotos(req.params.id);
  res.json({ photos: items });
};

export const uploadPhoto = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  if (!req.file) throw badRequest("No file uploaded (field name: 'photo')");
  if (!req.file.mimetype.startsWith("image/")) {
    throw badRequest("Only image files are allowed");
  }

  const upload = await uploadMemorialPhoto({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
    memorialId: req.params.id,
  });

  const caption = typeof req.body?.caption === "string" ? req.body.caption : null;

  const record = await recordMemorialPhoto({
    memorialId: req.params.id,
    uploadedBy: user.id,
    photoUrl: upload.url,
    storagePath: upload.path,
    caption,
  });

  res.status(201).json(record);
};

export const removePhoto = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  const photo = await getMemorialPhoto(req.params.photoId, req.params.id);
  if (photo.storage_path) {
    await deleteStorageObject(photo.storage_path);
  }
  await deleteMemorialPhotoRecord(req.params.photoId);
  res.status(204).send();
};

export const guestbookForOwner = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  const entries = await listGuestbookForOwner(req.params.id);
  res.json({ entries });
};

export const approveGuestbook = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  const entry = await approveGuestbookEntry(req.params.entryId, req.params.id, user.id);
  res.json(entry);
};

export const removeGuestbook = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  await deleteGuestbookEntry(req.params.entryId, req.params.id);
  res.status(204).send();
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getOwnedMemorial(req.params.id, user.id);
  if (!req.file) throw badRequest("No file uploaded (field: 'photo')");
  if (!req.file.mimetype.startsWith("image/"))
    throw badRequest("Only image files are allowed");
  const upload = await uploadObject({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
    pathPrefix: `memorials/${req.params.id}/profile`,
  });
  const { data, error } = await supabase
    .from("memorials")
    .update({ profile_photo_url: upload.url, profile_photo_path: upload.path })
    .eq("id", req.params.id)
    .select("profile_photo_url")
    .single();
  if (error) throw error;
  res.json(data);
};

