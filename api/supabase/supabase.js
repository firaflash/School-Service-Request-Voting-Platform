import { supabase } from './supabaseClient.js';
export const uploadPost = async (req, res) => {
  try {
    // Now req.body should have content, category, client_key
    // req.file will be present only if a file was sent
    const { content, category, client_key } = req.body;

    if (!content || !client_key) {
      return res.status(400).json({
        error: 'Missing required fields: content and client_key',
      });
    }

    let photo_path = null;

    // req.file exists only when a file was uploaded
    if (req.file) {
      photo_path = await uploadImageToStorage(req.file);   // ← req.file, not req.image
      if (!photo_path) {
        return res.status(500).json({ error: 'Image upload failed' });
      }
    }

    const insertData = {
      content,
      category: category || 'Other',
      client_key,
      photo_path,
      // created_at: new Date().toISOString(),   // ← Supabase can auto-set if column has default
    };

    const { data, error } = await supabase
      .from('requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(400).json({
        error: 'Failed to create request',
        details: error.message,
      });
    }

    res.status(201).json(data);

  } catch (err) {
    console.error('uploadPost error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
/**
 * Uploads file to Supabase Storage and returns public URL
 * @param {import('multer').Express.Multer.File} file
 * @returns {Promise<string | null>} public URL or null on failure
 */
async function uploadImageToStorage(file) {
  try {
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
    const filePath = `requests/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Request_Img')  
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('Request_Img')
      .getPublicUrl(filePath);

    return urlData.publicUrl || null;

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

    // 2. Fetch user votes
    let userVotes = [];
    if (client_key) {
      const { data } = await supabase
        .from('votes')
        .select('request_id, vote_type')
        .eq('client_key', client_key);

      userVotes = data || [];
    }

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
export const voteForPost = async (req, res) => {
  const { request_id, vote_type, client_key } = req.body;

  // validate vote_type
  if (![1, -1, 0].includes(vote_type)) {
    return res.status(400).json({ error: "Invalid vote" });
  }

  try {
    if (vote_type === 0) {
      // Remove the vote if it exists
      await supabase
        .from('votes')
        .delete()
        .eq('request_id', request_id)
        .eq('client_key', client_key);
    } else {
      // Insert or update vote
      await supabase
        .from('votes')
        .upsert(
          { request_id, client_key, vote_type },
          { onConflict: 'request_id,client_key' } // matches UNIQUE constraint
        );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Voting failed' });
  }
};


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