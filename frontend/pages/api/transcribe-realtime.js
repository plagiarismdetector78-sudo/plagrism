import fs from "fs";
import path from "path";
import os from "os";
import formidable from "formidable";
import Groq from "groq-sdk";

export const config = {
  api: { bodyParser: false },
};


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Safe temp upload directory
  const uploadDir = path.join(os.tmpdir(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "File parse error" });
    }

    const audioFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!audioFile || !audioFile.filepath) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const filePath = audioFile.filepath;

    try {
      // Check if GROQ_API_KEY is configured
      if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY not configured");
        fs.unlink(filePath, () => {});
        return res.status(200).json({
          text: "[Transcription unavailable - API key not configured]",
        });
      }

      // Check file size - if too small, skip transcription
      const stats = fs.statSync(filePath);
      console.log("📊 Audio file size:", stats.size, "bytes");
      
      if (stats.size < 1000) { // Less than 1KB
        console.log("⚠️ Audio chunk too small, skipping transcription");
        fs.unlink(filePath, () => {});
        return res.status(200).json({
          text: "",
          skipped: true,
          reason: "chunk_too_small"
        });
      }

      console.log("🎯 Sending to GROQ Whisper API...");
      // 🎙️ GROQ WHISPER (FAST + FREE)
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-large-v3",
        language: "en",
        response_format: "json",
        temperature: 0.0,
      });

      // 🧹 Cleanup temp file
      fs.unlink(filePath, () => {});

      const text = transcription.text?.trim() || "";
      console.log("✅ Transcription result:", text || "(empty)");
      
      return res.status(200).json({
        text: text,
      });
    } catch (error) {
      console.error("❌ Groq transcription error:");
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error status:", error.status);
      console.error("Full error:", JSON.stringify(error, null, 2));
      
      fs.unlink(filePath, () => {});
      
      // Return error details for debugging
      return res.status(200).json({
        text: "",
        error: true,
        errorMessage: error.message || "Unknown error",
        errorCode: error.code || error.status,
      });
    }
  });
}
