import requests
from dotenv import load_dotenv
import os

load_dotenv()
hf_token = os.getenv("HF_TOKEN")


def split_text_into_chunks(text, max_tokens=1000):
    from transformers import AutoTokenizer

    # Load the tokenizer
    tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

    # Tokenize the text
    tokens = tokenizer(text, return_tensors="pt",
                       truncation=False)["input_ids"][0]

    # Split into chunks
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk = tokens[i:i + max_tokens]
        chunks.append(tokenizer.decode(chunk, skip_special_tokens=True))

    return chunks


def summarize_chunks(chunks):
    Summarization_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {hf_token}"}

    summaries = []
    for chunk in chunks:
        payload = {
            "inputs": chunk
        }
        response = requests.post(
            Summarization_URL, headers=headers, json=payload)
        if response.status_code == 200:
            summaries.append(response.json())
        else:
            print(f"Error summarizing chunk: {response.text}")

    for summary in summaries:
        return summary


# Example usage
def summarization_and_return(input_text):
    chunks = split_text_into_chunks(input_text)
    summaries = summarize_chunks(chunks)
    return summaries
