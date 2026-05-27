import type { Request, Response } from "express";
import { chatSchema, createVaultSchema, grantAccessSchema, updateBiographySchema, updateVaultSchema } from "../schemas/vault.js";
import {
  createVault,
  deleteVault,
  deleteVaultFileRecord,
  getVault,
  getVaultFile,
  grantVaultAccess,
  listVaultAccess,
  listVaultFiles,
  listVaultsForUser,
  recordVaultFile,
  revokeVaultAccess,
  updateVault,
  updateVaultFileTranscript,
} from "../services/vaultService.js";
import { transcribeAudio } from "../services/transcriptionService.js";
import {
  classifyFileType,
  deleteVaultFile as deleteStorageObject,
  uploadVaultFile,
} from "../services/storageService.js";
import { listConversations, listMessages, sendChatMessage } from "../services/chatService.js";
import { generateBiography, getBiography, updateBiography } from "../services/biographyService.js";
import { buildVaultExport, listActivity, logActivity, searchVault } from "../services/vaultExtrasService.js";
import {
  enforceCanCreateVault,
  enforceCanGenerateBiography,
  enforceCanSendChatMessage,
  enforceCanUploadFile,
} from "../services/entitlementsService.js";
import { uploadObject } from "../services/storageService.js";
import { supabase } from "../config/supabase.js";
import { badRequest, unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const create = async (req: Request, res: Response) => {
  const user = getUser(req);
  await enforceCanCreateVault(user.id);
  const body = createVaultSchema.parse(req.body);
  const vault = await createVault(user.id, body);
  res.status(201).json(vault);
};

export const list = async (req: Request, res: Response) => {
  const user = getUser(req);
  const vaults = await listVaultsForUser(user.id, user.email);
  res.json({ vaults });
};

export const detail = async (req: Request, res: Response) => {
  const user = getUser(req);
  const vault = await getVault(req.params.id, user.id, user.email);
  res.json(vault);
};

export const update = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = updateVaultSchema.parse(req.body);
  const vault = await updateVault(req.params.id, user.id, body);
  res.json(vault);
};

export const remove = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deleteVault(req.params.id, user.id);
  res.status(204).send();
};

export const uploadFile = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);

  if (!req.file) throw badRequest("No file uploaded (field name: 'file')");
  await enforceCanUploadFile(user.id, req.params.id, req.file.size);

  const upload = await uploadVaultFile({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
    vaultId: req.params.id,
  });

  const record = await recordVaultFile({
    vaultId: req.params.id,
    uploadedBy: user.id,
    fileType: classifyFileType(req.file.mimetype),
    fileUrl: upload.url,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    storagePath: upload.path,
  });

  void logActivity({
    vaultId: req.params.id,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "file_uploaded",
    metadata: { file_name: req.file.originalname, file_type: classifyFileType(req.file.mimetype) },
  });

  // Fire-and-forget transcription for audio/video. The HTTP response returns
  // immediately; transcript appears in DB once Whisper completes. Errors are
  // swallowed inside transcribeAudio — they never block the upload.
  const mime = req.file.mimetype;
  const buffer = req.file.buffer;
  const originalName = req.file.originalname;
  if (mime.startsWith("audio/") || mime.startsWith("video/")) {
    void (async () => {
      const text = await transcribeAudio(buffer, originalName, mime);
      if (text) {
        try {
          await updateVaultFileTranscript(record.id, text);
        } catch (e) {
          console.error("[transcription] failed to persist transcript:", e);
        }
      }
    })();
  }

  res.status(201).json(record);
};

export const files = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const items = await listVaultFiles(req.params.id);
  res.json({ files: items });
};

export const removeFile = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const file = await getVaultFile(req.params.fileId, req.params.id);
  if (file.storage_path) {
    await deleteStorageObject(file.storage_path);
  }
  await deleteVaultFileRecord(req.params.fileId);
  void logActivity({
    vaultId: req.params.id,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "file_deleted",
    metadata: { file_name: file.file_name },
  });
  res.status(204).send();
};

export const grantAccess = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = grantAccessSchema.parse(req.body);
  const access = await grantVaultAccess(req.params.id, user.id, body.email, body.role);
  void logActivity({
    vaultId: req.params.id,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "access_granted",
    metadata: { email: body.email, role: body.role },
  });
  res.status(201).json(access);
};

export const accessList = async (req: Request, res: Response) => {
  const user = getUser(req);
  const entries = await listVaultAccess(req.params.id, user.id);
  res.json({ entries });
};

export const revokeAccess = async (req: Request, res: Response) => {
  const user = getUser(req);
  await revokeVaultAccess(req.params.id, req.params.accessId, user.id);
  void logActivity({
    vaultId: req.params.id,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "access_revoked",
  });
  res.status(204).send();
};

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  if (!req.file) throw badRequest("No file uploaded (field: 'photo')");
  if (!req.file.mimetype.startsWith("image/"))
    throw badRequest("Only image files are allowed");
  const upload = await uploadObject({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalName: req.file.originalname,
    pathPrefix: `vaults/${req.params.id}/profile`,
  });
  const { data, error } = await supabase
    .from("memory_vaults")
    .update({ profile_photo_url: upload.url, profile_photo_path: upload.path })
    .eq("id", req.params.id)
    .select("profile_photo_url")
    .single();
  if (error) throw error;
  res.json(data);
};

export const biographyGet = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const bio = await getBiography(req.params.id);
  res.json(bio);
};

export const biographyGenerate = async (req: Request, res: Response) => {
  const user = getUser(req);
  await enforceCanGenerateBiography(user.id);
  const bio = await generateBiography(req.params.id, user.id);
  res.json(bio);
};

export const biographyUpdate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = updateBiographySchema.parse(req.body);
  const bio = await updateBiography(req.params.id, user.id, body.text);
  res.json(bio);
};

export const activity = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const entries = await listActivity(req.params.id, 50);
  res.json({ entries });
};

export const search = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const q = String(req.query.q ?? "");
  if (!q.trim()) {
    res.json({ files: [], messages: [] });
    return;
  }
  const results = await searchVault(req.params.id, q);
  res.json(results);
};

export const exportVault = async (req: Request, res: Response) => {
  const user = getUser(req);
  const vault = await getVault(req.params.id, user.id, user.email);
  const zipBuffer = await buildVaultExport(req.params.id);
  const safeName = vault.deceased_name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "vault";
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="presence-${safeName}-${Date.now()}.zip"`
  );
  res.send(zipBuffer);
};

export const chat = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  await enforceCanSendChatMessage(user.id);
  const body = chatSchema.parse(req.body);
  const result = await sendChatMessage({
    vaultId: req.params.id,
    userId: user.id,
    userMessage: body.message,
    conversationId: body.conversation_id,
  });
  res.json(result);
};

export const conversations = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const items = await listConversations(req.params.id);
  res.json({ conversations: items });
};

export const conversationMessages = async (req: Request, res: Response) => {
  const user = getUser(req);
  await getVault(req.params.id, user.id, user.email);
  const items = await listMessages(req.params.conversationId);
  res.json({ messages: items });
};
