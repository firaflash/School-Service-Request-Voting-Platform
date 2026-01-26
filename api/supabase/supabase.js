import { supabase } from './supabaseClient.js';

export const uploadPost = async (req, res) => {
  try {
    // 1. Get text fields from body
    const { description, category, client_key } = req.body;

    if (!description || !client_key) {
      return res.status(400).json({ error: 'Missing required fields: description and client_key' });
    }

    // 2. Handle optional file upload
    let photo_path = null;

    if (req.file) {  // multer attached the file here
      photo_path = await uploadImageToStorage(req.file);
      if (!photo_path) {
        return res.status(500).json({ error: 'Image upload failed' });
      }
    }

    // 3. Prepare data for DB insert
    const content = {
      description,           // adjust column names to match your table exactly
      category: category || 'General',
      client_key,
      photo_path,            // now contains the public URL or signed path
      // created_at auto-handled by DB default
    };

    // 4. Insert into DB
    const { data, error } = await supabase
      .from('Request')       // ← case-sensitive! Check your table name
      .insert(content)
      .select();

    if (error) {
      console.error('DB insert error:', error.message);
      return res.status(400).json({
        error: 'Failed to create request',
        details: error.message,
      });
    }

    console.log('Success:', data);

    return res.status(201).json({
      message: 'Request created successfully',
      request: data[0],  // inserted row
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Uploads file to Supabase Storage and returns public URL
 * @param {import('multer').Express.Multer.File} file
 * @returns {Promise<string | null>} public URL or null on failure
 */
async function uploadImageToStorage(file) {
  try {
    // Generate unique filename (avoid overwrites)
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `requests/${fileName}`; // folder inside bucket

    // Upload using .upload()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('publicImg')                     // your bucket name
      .upload(filePath, file.buffer, {       // ← use buffer!
        contentType: file.mimetype,
        upsert: false,                       // don't overwrite if same name
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return null;
    }

    // Get public URL (if bucket is public)
    const { data: urlData } = supabase.storage
      .from('publicImg')
      .getPublicUrl(filePath);

    return urlData.publicUrl;  // e.g. https://your-project.supabase.co/storage/v1/object/public/publicImg/requests/...

  } catch (err) {
    console.error('Image upload exception:', err);
    return null;
  }
}


export const deletePost = async (req,res) =>{
    
}
export const updatePost = async (req,res) =>{
    
}
export const fetchPost = async (req,res) =>{
    const Resposne ={
        "id": 12,
        "content": "We need more power outlets in the library study area.",
        "category": "Facilities",
        "created_at": "2026-01-24T18:20:00Z",

        "votes": {
            "up": 45,
            "down": 2,
            "score": 43,
            "userVote": 1
        },

        "photo_path": "https://abc.supabase.co/storage/v1/object/public/request-photos/img.png",
        "canDelete": false
        }

    try{
        
    }catch(err){
        console.log('Error With Post Fetching Mechanism');
    }

}
export const voteForPost = async (req , res )=>{
    const voteData = {
        request_id: 1,
        client_key: "MOB-CHR-22",
        vote_type: 1,
    }
    try{
        const { data , err } = await supabase
        .from('votes')
        .upsert(voteData)
        .select()

    }catch(err){
        console.log("Error Found " , err);
    }
    res.json("Vote Table Resposne");
}
const fetchVotes =  async () =>{
    try{
        const { data ,error } = await supabase
        .from('votes')
        .select('*')
        
        if (error) {
      console.error('DB insert error:', error.message);
      return res.status(400).json({
        error: 'Failed to fetch votes',
        details: error.message,
      });
    }

    // console.log('Success:', data);

    // return res.status(201).json({
    //   message: 'Request created successfully',
    //   request: data[0],  // inserted row
    // });
        
    }catch(err){
        console.log("Error With the Vote Fetching ");
    }
}