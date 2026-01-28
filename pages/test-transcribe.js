export default function TestTranscribe() {
  const send = async () => {
    const input = document.getElementById("audio");
    const file = input.files[0];

    if (!file) {
      alert("Select an audio file first");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/transcribe-realtime", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      document.getElementById("out").textContent =
        JSON.stringify(data, null, 2);
    } catch (err) {
      document.getElementById("out").textContent =
        "Error: " + err.message;
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>🎙 Speech-to-Text Test (Groq Whisper)</h2>

      <input type="file" id="audio" accept="audio/*" />
      <br /><br />

      <button onClick={send}>
        Upload & Transcribe
      </button>

      <pre
        id="out"
        style={{
          marginTop: 20,
          background: "#111",
          color: "#0f0",
          padding: 15,
          minHeight: 120,
        }}
      />
    </div>
  );
}
