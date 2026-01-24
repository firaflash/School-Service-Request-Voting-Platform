import { supabase } from './supabaseClient.js';

export  const uploadPost =  async (req,res) =>{
    const content = req.body;
    console.log(content);
    try{
        const { data , err} = supabase
        .from('requests')
        .insert(content)
        .select();

        console.log(data? data : "nothing uploaded ");

    }catch(err){
        console.log("Error occured ",err);
    }
    res.json("This is the inital Response to the request ");

}
export const deletePost = async (req,res) =>{
    
}
export const updatePost = async (req,res) =>{
    
}
export const fetchPost = async (req,res) =>{
    
}