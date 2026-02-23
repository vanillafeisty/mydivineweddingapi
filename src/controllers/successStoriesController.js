import { executeQuery } from "../config/database.js";

// 1. Get all stories 
export const getAllStories = async (req, res) => {
  try {
    const stories = await executeQuery("SELECT * FROM success_stories ORDER BY wedding_date DESC");
    res.json({ success: true, data: stories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stories" });
  }
};

// 2. Create a new story 
export const createStory = async (req, res) => {
  try {
    const { couple_name, location, wedding_date, quote, full_story } = req.body;
    const story_photo = req.file ? `/uploads/${req.file.filename}` : null;
    const countResult = await executeQuery("SELECT COUNT(*) as total FROM success_stories");
    const nextCount = countResult[0].total + 1;
    const nextId = `s${nextCount}`; 
    
    await executeQuery(
      "INSERT INTO success_stories (id, couple_name, location, wedding_date, story_photo, quote, full_story) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nextId, couple_name, location, wedding_date, story_photo, quote, full_story]
    );

    res.status(201).json({ 
      success: true, 
      message: "Story published successfully!", 
      id: nextId 
    });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ success: false, message: "Failed to create story", error: error.message });
  }
};


// 3. Update the story
export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const couple_name = req.body.couple_name || req.body.coupleName || null;
    const location = req.body.location || req.body.weddingLocation || null;
    const wedding_date = req.body.wedding_date || req.body.weddingDate || null;
    const quote = req.body.quote || req.body.mainQuote || null;
    const full_story = req.body.full_story || req.body.fullStory || null;

    console.log(`--- ADMIN UPDATE INITIATED FOR ID: ${id} ---`);
    let query = `
      UPDATE success_stories 
      SET couple_name = ?, 
          location = ?, 
          wedding_date = ?, 
          quote = ?, 
          full_story = ?, 
          updatedAt = NOW()
    `;

    let params = [couple_name, location, wedding_date, quote, full_story];
    if (req.file) {
      const new_photo_path = `/uploads/${req.file.filename}`;
      query += ", story_photo = ?";
      params.push(new_photo_path);
      console.log("-> New photo detected and added to update.");
    }

    query += " WHERE id = ?";
    params.push(id);

    const result = await executeQuery(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Story not found in database." });
    }

    res.json({ 
      success: true, 
      message: "✅ Changes have been saved." 
    });


  } catch (error) {
    console.error("DATABASE UPDATE ERROR:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Could not save changes.", 
      error: error.message 
    });
  }
};




// 4. Delete the story 
export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`--- ADMIN DELETE INITIATED FOR ID: ${id} ---`);
    const result = await executeQuery(
      "DELETE FROM success_stories WHERE id = ?", 
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Story not found." 
      });
    }

    res.json({ 
      success: true, 
      message: " Story has been permanently." 
    });

  } catch (error) {
    console.error("DELETE ERROR:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete story.", 
      error: error.message 
    });
  }
};