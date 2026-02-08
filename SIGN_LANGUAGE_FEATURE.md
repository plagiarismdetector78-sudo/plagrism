# Sign Language Detection Feature

## Overview
The sign language detection feature allows interviewers to enable real-time sign language recognition during video interviews. When enabled, the system captures frames from the candidate's video stream and converts detected hand signs into text, which is then added to the interview transcript.

## How It Works

### For Interviewers:
1. During a video interview, click the **hand icon** button in the bottom control bar
2. The system will start capturing video frames from the candidate's video stream every 2 seconds
3. Detected signs are converted to text and automatically added to the transcript
4. A blue indicator shows when sign language detection is active
5. Recent detected signs are displayed in the transcript sidebar
6. Click the hand icon again to stop detection

### Technical Implementation:

#### Frontend (Meeting Room)
- **Button**: Added to the interviewer's control bar (only visible to interviewers)
- **Visual Indicators**: 
  - Blue pulsing dot when active
  - "Processing..." indicator during frame analysis
  - Recently detected signs displayed in sidebar
- **Frame Capture**: Captures video frames every 2 seconds from candidate's video stream
- **Transcript Integration**: Detected signs are automatically appended to the transcript

#### Backend (API)
- **Endpoint**: `/api/detect-sign-language`
- **Method**: POST
- **Model**: Uses Hugging Face's sign language detection model
  - Model: `dima806/american_sign_language_image_detection`
  - Detects ASL (American Sign Language) alphabet letters
  
#### Sign Language Library
- **File**: `lib/sign-language-detection.js`
- **Features**:
  - TensorFlow.js-based local detection (optional)
  - Frame preprocessing and conversion
  - Confidence threshold filtering
  - Detection history smoothing

## Setup Requirements

### Environment Variables
Add to your `.env` file:
```
HUGGING_FACE_API_KEY=your_hugging_face_api_key_here
```

### Get Hugging Face API Key:
1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to Settings → Access Tokens
4. Create a new token with read permissions
5. Copy the token to your `.env` file

### Dependencies
- `@tensorflow/tfjs` - For client-side ML processing
- `@huggingface/inference` - For Hugging Face API integration

## Features

### Detection Capabilities:
- ✅ Recognizes A-Z alphabet signs
- ✅ Detects space gesture
- ✅ Real-time confidence scoring
- ✅ Smooth detection with history filtering
- ✅ Automatic transcript integration

### UI Components:
- 🤟 Hand icon button for toggle
- 🔵 Blue indicator when active
- 📊 Confidence percentage display
- 📝 Recently detected signs list
- 🔄 Processing status indicator

## Usage Example

### During an Interview:
1. **Start Interview**: Begin video interview as normal
2. **Enable Detection**: Click the hand icon button
3. **Candidate Signs**: Candidate performs sign language gestures
4. **Auto-Transcription**: System detects signs and adds to transcript:
   - "H" → "H"
   - "E" → "HE"
   - "L" → "HEL"
   - "L" → "HELL"
   - "O" → "HELLO"
5. **Review**: All detected signs appear in the transcript for later review

## Technical Details

### Frame Processing:
- **Interval**: 2 seconds between captures
- **Resolution**: 224x224 pixels
- **Format**: JPEG with 0.8 quality
- **Processing**: Base64 encoding for API transmission

### Detection Flow:
```
Video Stream → Frame Capture → Canvas Processing → 
Base64 Encoding → API Call → Hugging Face Model → 
Prediction → Confidence Check → Transcript Update
```

### Performance:
- **Model Load Time**: ~20 seconds (first use)
- **Detection Time**: ~1-2 seconds per frame
- **Memory Usage**: Minimal (canvas-based processing)
- **Accuracy**: Depends on lighting, hand positioning, and camera quality

## Limitations

- Requires good lighting conditions
- Works best with clear, deliberate hand signs
- Model loading may take 20-30 seconds on first use
- Requires Hugging Face API key with active quota
- Currently supports ASL alphabet only (A-Z letters)

## Future Enhancements

- [ ] Support for more sign language systems (BSL, JSL, etc.)
- [ ] Word and phrase recognition
- [ ] Offline mode with local TensorFlow.js model
- [ ] Improved accuracy with custom training data
- [ ] Real-time video overlay with detected signs
- [ ] Sign language gesture library/reference

## Troubleshooting

### "Model Loading" message:
- Wait 20-30 seconds for model to initialize on Hugging Face servers
- Check your Hugging Face API key is valid

### No signs detected:
- Ensure candidate's video is visible and clear
- Check lighting conditions
- Verify hand is within camera frame
- Try more deliberate, slower hand movements

### Low confidence scores:
- Improve lighting
- Position hand closer to camera
- Make clearer, more distinct gestures
- Reduce background clutter

## Credits
- Sign Language Model: [dima806/american_sign_language_image_detection](https://huggingface.co/dima806/american_sign_language_image_detection)
- Powered by Hugging Face Inference API
- TensorFlow.js for client-side processing
