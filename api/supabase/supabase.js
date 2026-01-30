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
export const fetchPost = async (req, res) => {
  try {
    const client_key = req.query.client_key || null;

    // 1. Fetch posts
    const { data: posts, error } = await supabase
      .from('request_with_votes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    console.log("User Posts ",posts);

    // 2. Fetch user votes
    let userVotes = [];
    if (client_key) {
      const { data } = await supabase
        .from('votes')
        .select('request_id, vote_type')
        .eq('client_key', client_key);

      userVotes = data || [];
    }
    console.log("User Votes:", userVotes);

    // 3. Fetch comments
    const { data: comments } = await supabase
      .from('comments')
      .select('id, request_id, content, created_at')
      .order('created_at', { ascending: true });

    // 4. Shape response (THIS IS THE IMPORTANT PART)
    const response = posts.map(post => {
      const vote = userVotes.find(v => v.request_id === post.id);

      return {
        id: post.id,
        content: post.content,
        category: post.category,
        created_at: post.created_at,
        photo_path: post.photo_path,
        client_key: post.client_key,

        votes: {
          up: post.upvotes,
          down: post.downvotes,
          score: post.score,
          userVote: vote ? vote.vote_type : 0
        },

        comments: comments
          .filter(c => c.request_id === post.id)
          .map(c => ({
            id: c.id,
            text: c.content,
            created_at: c.created_at
          }))
      };
    });

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

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