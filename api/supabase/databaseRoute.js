import { Router } from "express";
import { uploadPost , deletePost , updatePost , fetchPost, voteForPost} from './supabase.js'


const router =  Router();

router.post('/upload',uploadPost);
router.post('/vote',voteForPost);
router.delete('/delete',deletePost);
router.put('/update',updatePost);
router.get('/fetch',fetchPost)

export default router;