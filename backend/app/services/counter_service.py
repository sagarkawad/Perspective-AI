import requests
from app.prompts.opposite_perspective import get_opposite_perspective_prompt
from dotenv import load_dotenv
import os

load_dotenv()
hf_token = os.getenv("HF_TOKEN")

PERSPECTIVE_URL = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
headers = {"Authorization": f"Bearer {hf_token}"}


def generate_opposite_perspective(article_text):
    final_prompt = get_opposite_perspective_prompt(article_text)
    json_prompt = {"inputs": final_prompt}
    response = requests.post(
        PERSPECTIVE_URL, headers=headers, json=json_prompt)

    result = response.json()[0]["generated_text"]
    perspective_raw = result.split("[RESPONSE]")[-1].strip()

    if "Opposite Perspective:" in perspective_raw:
        # format the response
        perspective = perspective_raw.replace(
            "Opposite Perspective:", "**Opposite Perspective:**\n")
    else:
        perspective = f"**Opposite Perspective**\n {perspective_raw}"
    return perspective
