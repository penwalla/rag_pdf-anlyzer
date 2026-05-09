from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import uuid
from dotenv import load_dotenv
import os
from elevenlabs import ElevenLabs
from .models import PDFUploadRequest, ChatRequest, ChatResponse, TTSRequest
from .utils import clean_markdown, process_pdf
from .vector_store import vector_store_manager
from .rag_processor import RAGProcessor

from elevenlabs.core.api_error import ApiError

# Load environment variables
load_dotenv()
google_key = os.getenv("GOOGLE_API_KEY")
tts_key = os.getenv("ELEVENLABS_API_KEY")

if not google_key or not tts_key:
    raise EnvironmentError("Missing API keys in environment variables")

eleven_client = ElevenLabs(api_key=tts_key)


app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_processor = RAGProcessor()

# Language mapping
LANGUAGES = {
    "English": {"code": "en", "name": "English"},
    "Hindi": {"code": "hi", "name": "Hindi"},
    "Bengali": {"code": "bn", "name": "Bengali"},
    "Telugu": {"code": "te", "name": "Telugu"},
    "Marathi": {"code": "mr", "name": "Marathi"},
    "Tamil": {"code": "ta", "name": "Tamil"}
}

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, str] = {}  # session_id: tts_language
    
    def create_session(self, tts_language="English") -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = tts_language
        return session_id
    
    def get_tts_language(self, session_id: str) -> str:
        return self.sessions.get(session_id, "English")
    
    def update_tts_language(self, session_id: str, language: str):
        if session_id in self.sessions:
            self.sessions[session_id] = language

session_manager = SessionManager()

@app.post("/create_session")
async def create_session(tts_language: str = "English"):
    session_id = session_manager.create_session(tts_language)
    return {"session_id": session_id}

@app.post("/update_tts_language")
async def update_tts_language(session_id: str, language: str):
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Invalid language")
    session_manager.update_tts_language(session_id, language)
    return {"status": "success"}

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...), session_id: str = None):
    if not session_id:
        session_id = session_manager.create_session()
    
    file_bytes = await file.read()
    vectorstore = process_pdf(file_bytes)
    vector_store_manager.add_session(session_id, vectorstore)
    
    return {
        "session_id": session_id,
        "file_name": file.filename,
        "status": "processed"
    }

@app.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    if not vector_store_manager.session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    tts_language = session_manager.get_tts_language(request.session_id)
    retriever = vector_store_manager.get_retriever(request.session_id)
    rag_chain = rag_processor.create_chain(retriever)
    
    full_response = rag_chain.invoke(request.question)
    cleaned_text = clean_markdown(full_response)
    
    translated_text = None
    if tts_language != "English":
        lang_name = LANGUAGES[tts_language]["name"]
        translated_text = rag_processor.translate_text(cleaned_text, lang_name)
    
    return ChatResponse(
        answer=full_response,
        translated_answer=translated_text
    )

@app.post("/generate_tts")
async def generate_tts(request: TTSRequest):
    text = request.text
    language = request.language

    if language != "English":
        lang_name = LANGUAGES[language]["name"]
        text = rag_processor.translate_text(text, lang_name)

    try:
        audio_stream = eleven_client.text_to_speech.convert(
            text=text,
            voice_id="21m00Tcm4TlvDq8ikWAM",  # ✅ Rachel Voice ID (example)
            model_id="eleven_multilingual_v2"
        )

        audio_bytes = b"".join(audio_stream)

        return {"audio": audio_bytes.hex()}

    except ApiError as e:
        # Send clean ElevenLabs error to frontend
        raise HTTPException(status_code=e.status_code, detail=e.body)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
