import { Router } from "express";
import multer from "multer";
import {
  uploadPost,
  deletePost,
  updatePost,
  fetchPost,
  voteForPost
} from "./supabase.js";

const router = Router();

/* ---------- Multer config ---------- */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ---------- Routes ---------- */
router.post("/upload", upload.single("image"), uploadPost);
router.post("/vote", voteForPost);
router.put("/comment", updatePost);
router.delete("/delete", deletePost);
router.get("/fetch", fetchPost);

export default router;
