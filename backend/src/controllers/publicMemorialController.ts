import type { Request, Response } from "express";
import { guestbookSubmitSchema } from "../schemas/memorial.js";
import {
  getPublicMemorialBySlug,
  listApprovedGuestbook,
  listMemorialPhotos,
  submitGuestbookEntry,
} from "../services/memorialService.js";

export const getMemorial = async (req: Request, res: Response) => {
  const memorial = await getPublicMemorialBySlug(req.params.slug);
  res.json(memorial);
};

export const getPhotos = async (req: Request, res: Response) => {
  const memorial = await getPublicMemorialBySlug(req.params.slug);
  const photos = await listMemorialPhotos(memorial.id);
  // Strip private fields before sending to public visitors.
  const sanitized = photos.map((p) => ({
    id: p.id,
    photo_url: p.photo_url,
    caption: p.caption,
    date_taken: p.date_taken,
    created_at: p.created_at,
  }));
  res.json({ photos: sanitized });
};

export const getGuestbook = async (req: Request, res: Response) => {
  const memorial = await getPublicMemorialBySlug(req.params.slug);
  const entries = await listApprovedGuestbook(memorial.id);
  res.json({ entries });
};

export const submitGuestbook = async (req: Request, res: Response) => {
  const memorial = await getPublicMemorialBySlug(req.params.slug);
  const body = guestbookSubmitSchema.parse(req.body);
  const entry = await submitGuestbookEntry({
    memorialId: memorial.id,
    visitorName: body.visitor_name,
    visitorEmail: body.visitor_email,
    message: body.message,
  });
  // Don't return the full entry — visitor doesn't need internal IDs/timestamps detail.
  res.status(202).json({
    queued: true,
    id: entry.id,
    message: "Tu mensaje fue enviado y aparecerá una vez la familia lo apruebe.",
  });
};
