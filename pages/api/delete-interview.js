import { query } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing interview ID",
      });
    }

    await query(`DELETE FROM scheduled_interviews WHERE id = $1`, [id]);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to delete interview",
    });
  }
}
