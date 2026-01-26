import { supabase } from './supabaseClient.js';

export  const uploadPost =  async (req,res) =>{
    // const content = req.body;
    const content = {
        content:"This is the first yapping sessios stuff that's done",
        category:"Maintenance",
        client_key:"WIN-333"
    }
    try{
        const { data , err} = supabase
        .from('requests')
        .insert(content)
        // .select();

        console.log(data? data : "nothing uploaded ");
        console.log(err ? err : "No Error");

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