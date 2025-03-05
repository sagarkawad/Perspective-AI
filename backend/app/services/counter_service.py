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

   # Convert the result to lowercase for case-insensitive checking
    result_lower = result.lower()

    # Check if "**opposite perspective:**" exists
    if "**opposite perspective:**" in result_lower:
        start_index = result.find("**OPPOSITE PERSPECTIVE:**")
        if start_index != -1:
            perspective = result[start_index:].strip()
    else:
        # Check if "opposite perspective:" exists without **
        if "opposite perspective:" in result_lower:
            start_index = result_lower.find("opposite perspective:")
            if start_index != -1:
                # Add ** at the start and end of "OPPOSITE PERSPECTIVE:"
                perspective = f"**OPPOSITE PERSPECTIVE:**\n{
                    result[start_index + len('opposite perspective:'):].strip()}"
        else:
            # If "opposite perspective:" is not found, return the entire result
            perspective = f"**OPPOSITE PERSPECTIVE:**\n{result.strip()}"

    return perspective
