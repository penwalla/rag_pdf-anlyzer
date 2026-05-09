from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
google_key = os.getenv("GOOGLE_API_KEY")

if not google_key:
    raise EnvironmentError("GOOGLE_API_KEY is not set")


class RAGProcessor:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3
        )
        self.template = """You are an expert assistant for question-answering tasks. 
Answer the question based only on the following context. 
If you don't know the answer, say you don't know. 
Keep the answer concise and add bullet points when appropriate.

Context:
{context}

Question: 
{question}

Helpful Answer:"""
        self.custom_rag_prompt = ChatPromptTemplate.from_template(self.template)
    
    def create_chain(self, retriever):
        return (
            {"context": retriever, "question": RunnablePassthrough()}
            | self.custom_rag_prompt
            | self.llm
            | StrOutputParser()
        )
    
    def translate_text(self, text: str, target_language: str) -> str:
        translator = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3
        )
        
        prompt = ChatPromptTemplate.from_template(
            "You are a professional translator. Translate the following text to {target_language}:\n\n"
            "{text}\n\n"
            "Important instructions:\n"
            "1. Maintain the original meaning accurately\n"
            "2. Use natural, conversational language\n"
            "3. Preserve any technical terms or proper names\n"
            "4. Ensure cultural appropriateness for {target_language} speakers\n"
            "5. Keep the translation concise and fluent\n"
            "6. Do not add any explanations or notes\n\n"
            "Return only the translated text."
        )
        
        translation_chain = (
            {"target_language": RunnablePassthrough(), "text": RunnablePassthrough()}
            | prompt
            | translator
            | StrOutputParser()
        )
        
        return translation_chain.invoke({
            "target_language": target_language,
            "text": text
        })