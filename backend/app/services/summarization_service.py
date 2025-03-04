import requests
from dotenv import load_dotenv
import os
from fastapi import HTTPException

load_dotenv()
hf_token = os.getenv("HF_TOKEN")

Summarization_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
headers = {"Authorization": f"Bearer {hf_token}"}


def summarize_text(payload):
    response = requests.post(Summarization_URL, headers=headers, json=payload)
    if "error" in response.json():
        raise HTTPException(status_code=500, detail=response.json["error"])
    return response.json()
