import { Router } from "express";
import { uploadPost , deletePost , updatePost , fetchPost} from './supabase.js'


const router =  Router();

router.post('/upload',uploadPost);
router.delete('/delete',deletePost);
router.put('/update',updatePost);
router.get('/fetch',fetchPost)

export default router;