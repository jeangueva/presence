import type { Request, Response } from "express";
import {
  assetSchema,
  dependentSchema,
  estateSchema,
  finalWishesSchema,
  heirSchema,
  petSchema,
  posthumousMessageSchema,
  willSchema,
} from "../schemas/legacy.js";
import {
  buildWillDocument,
  createAsset,
  createDependent,
  createHeir,
  createPet,
  createPosthumousMessage,
  deleteAsset,
  deleteDependent,
  deleteHeir,
  deletePet,
  deletePosthumousMessage,
  getEstate,
  getFinalWishes,
  getWill,
  listAssets,
  listDependents,
  listHeirs,
  listPets,
  listPosthumousMessages,
  sealWill,
  upsertEstate,
  upsertFinalWishes,
  upsertWill,
} from "../services/legacyService.js";
import { unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

// Dependents
export const dependentsList = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json({ entries: await listDependents(user.id) });
};
export const dependentsCreate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = dependentSchema.parse(req.body);
  res.status(201).json(await createDependent(user.id, body));
};
export const dependentsDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deleteDependent(user.id, req.params.id);
  res.status(204).send();
};

// Pets
export const petsList = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json({ entries: await listPets(user.id) });
};
export const petsCreate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = petSchema.parse(req.body);
  res.status(201).json(await createPet(user.id, body));
};
export const petsDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deletePet(user.id, req.params.id);
  res.status(204).send();
};

// Final wishes
export const finalWishesGet = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json(await getFinalWishes(user.id));
};
export const finalWishesSave = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = finalWishesSchema.parse(req.body);
  res.json(await upsertFinalWishes(user.id, body));
};

// Estate
export const estateGet = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json(await getEstate(user.id));
};
export const estateSave = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = estateSchema.parse(req.body);
  res.json(await upsertEstate(user.id, body));
};
export const heirsList = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json({ entries: await listHeirs(user.id) });
};
export const heirsCreate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = heirSchema.parse(req.body);
  res.status(201).json(await createHeir(user.id, body));
};
export const heirsDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deleteHeir(user.id, req.params.id);
  res.status(204).send();
};
export const assetsList = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json({ entries: await listAssets(user.id) });
};
export const assetsCreate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = assetSchema.parse(req.body);
  res.status(201).json(await createAsset(user.id, body));
};
export const assetsDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deleteAsset(user.id, req.params.id);
  res.status(204).send();
};

// Digital will
export const willGet = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json(await getWill(user.id));
};
export const willSave = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = willSchema.parse(req.body);
  res.json(await upsertWill(user.id, body));
};
export const willDocument = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json(await buildWillDocument(user.id));
};
export const willSeal = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json(await sealWill(user.id));
};

// Posthumous messages
export const posthumousList = async (req: Request, res: Response) => {
  const user = getUser(req);
  res.json({ entries: await listPosthumousMessages(user.id) });
};
export const posthumousCreate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = posthumousMessageSchema.parse(req.body);
  res.status(201).json(await createPosthumousMessage(user.id, body));
};
export const posthumousDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  await deletePosthumousMessage(user.id, req.params.id);
  res.status(204).send();
};
