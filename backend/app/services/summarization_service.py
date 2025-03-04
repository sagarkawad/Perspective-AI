import requests
from dotenv import load_dotenv
import os
from transformers import pipeline

load_dotenv()
hf_token = os.getenv("HF_TOKEN")

Summarization_URL = "https://api-inference.huggingface.co/models/google/bigbird-pegasus-large-arxiv"
headers = {"Authorization": f"Bearer {hf_token}"}


def summarize_text(payload):

    response = requests.post(Summarization_URL, headers=headers, json=payload)
    return response.json()


# def summarize_text(cleaned_content):
#     # Load the BART summarization pipeline
#     summarizer_bart = pipeline("summarization", model="facebook/bart-large-cnn")
#     summary_bart = summarizer_bart(cleaned_content, max_length=50, min_length=25, do_sample=False)
#     return {"summary": summary_bart[0]['summary_text']}
#
