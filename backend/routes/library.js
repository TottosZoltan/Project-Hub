const express = require("express");
const { pool } = require("../database");
const { getAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

async function user(req){ return await getAuthenticatedUser(req); }

router.get("/api/library/games", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const r=await pool.query(`SELECT id,name,image,minutes,status,favorite,created_at,updated_at FROM custom_games WHERE user_id=$1 ORDER BY favorite DESC,updated_at DESC`,[u.id]);
    res.json({success:true,games:r.rows});
  } catch(e){ console.error("CUSTOM GAMES GET",e); res.status(500).json({success:false,message:"Nem sikerült betölteni a saját játékokat."}); }
});
router.post("/api/library/games", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const name=String(req.body?.name||"").trim(); if(!name) return res.status(400).json({success:false,message:"A játék neve kötelező."});
    const r=await pool.query(`INSERT INTO custom_games(user_id,name,image,minutes,status,favorite) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[u.id,name,String(req.body?.image||""),Math.max(0,Number(req.body?.minutes)||0),String(req.body?.status||"backlog"),Boolean(req.body?.favorite)]);
    res.status(201).json({success:true,game:r.rows[0]});
  } catch(e){ console.error("CUSTOM GAMES POST",e); res.status(500).json({success:false,message:"Nem sikerült elmenteni a játékot."}); }
});
router.patch("/api/library/games/:id", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const id=Number(req.params.id); const r=await pool.query(`UPDATE custom_games SET name=COALESCE($1,name),image=COALESCE($2,image),minutes=COALESCE($3,minutes),status=COALESCE($4,status),favorite=COALESCE($5,favorite),updated_at=CURRENT_TIMESTAMP WHERE id=$6 AND user_id=$7 RETURNING *`,[req.body?.name?.toString().trim()||null,req.body?.image!=null?String(req.body.image):null,req.body?.minutes!=null?Math.max(0,Number(req.body.minutes)||0):null,req.body?.status!=null?String(req.body.status):null,req.body?.favorite!=null?Boolean(req.body.favorite):null,id,u.id]);
    if(!r.rowCount) return res.status(404).json({success:false,message:"A játék nem található."}); res.json({success:true,game:r.rows[0]});
  } catch(e){ console.error("CUSTOM GAMES PATCH",e); res.status(500).json({success:false,message:"Nem sikerült módosítani a játékot."}); }
});
router.delete("/api/library/games/:id", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const r=await pool.query(`DELETE FROM custom_games WHERE id=$1 AND user_id=$2 RETURNING id`,[Number(req.params.id),u.id]); if(!r.rowCount) return res.status(404).json({success:false,message:"A játék nem található."}); res.json({success:true});
  } catch(e){ console.error("CUSTOM GAMES DELETE",e); res.status(500).json({success:false,message:"Nem sikerült törölni a játékot."}); }
});

router.get("/api/places", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const r=await pool.query(`SELECT id,name,category,address,notes,favorite,created_at,updated_at FROM places WHERE user_id=$1 ORDER BY favorite DESC,updated_at DESC`,[u.id]); res.json({success:true,places:r.rows});
  } catch(e){ console.error("PLACES GET",e); res.status(500).json({success:false,message:"Nem sikerült betölteni a helyeket."}); }
});
router.post("/api/places", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const name=String(req.body?.name||"").trim(); if(!name) return res.status(400).json({success:false,message:"A hely neve kötelező."});
    const r=await pool.query(`INSERT INTO places(user_id,name,category,address,notes,favorite) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[u.id,name,String(req.body?.category||"Egyéb"),String(req.body?.address||""),String(req.body?.notes||""),Boolean(req.body?.favorite)]); res.status(201).json({success:true,place:r.rows[0]});
  } catch(e){ console.error("PLACES POST",e); res.status(500).json({success:false,message:"Nem sikerült elmenteni a helyet."}); }
});
router.patch("/api/places/:id", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."});
    const r=await pool.query(`UPDATE places SET name=COALESCE($1,name),category=COALESCE($2,category),address=COALESCE($3,address),notes=COALESCE($4,notes),favorite=COALESCE($5,favorite),updated_at=CURRENT_TIMESTAMP WHERE id=$6 AND user_id=$7 RETURNING *`,[req.body?.name?.toString().trim()||null,req.body?.category!=null?String(req.body.category):null,req.body?.address!=null?String(req.body.address):null,req.body?.notes!=null?String(req.body.notes):null,req.body?.favorite!=null?Boolean(req.body.favorite):null,Number(req.params.id),u.id]); if(!r.rowCount) return res.status(404).json({success:false,message:"A hely nem található."}); res.json({success:true,place:r.rows[0]});
  } catch(e){ console.error("PLACES PATCH",e); res.status(500).json({success:false,message:"Nem sikerült módosítani a helyet."}); }
});
router.delete("/api/places/:id", async (req,res)=>{
  try { const u=await user(req); if(!u) return res.status(401).json({success:false,message:"Érvényes bejelentkezés szükséges."}); const r=await pool.query(`DELETE FROM places WHERE id=$1 AND user_id=$2 RETURNING id`,[Number(req.params.id),u.id]); if(!r.rowCount) return res.status(404).json({success:false,message:"A hely nem található."}); res.json({success:true});
  } catch(e){ console.error("PLACES DELETE",e); res.status(500).json({success:false,message:"Nem sikerült törölni a helyet."}); }
});
module.exports=router;
