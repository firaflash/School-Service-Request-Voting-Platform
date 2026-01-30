import { Router } from "express";
import multer from "multer";
import {
  uploadPost,
  deletePost,
  fetchPost,
  voteForPost,
  postComment
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
router.post("/comment", postComment);
router.delete("/requests/:id", deletePost);
router.get("/fetch", fetchPost);

export default router;
