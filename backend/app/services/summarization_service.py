import requests
import os
import json
from dotenv import load_dotenv
import logging

load_dotenv()
openrouter_token = os.getenv("API_KEY")

Summarization_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {openrouter_token}",
    "Content-Type": "application/json",
}

logger = logging.getLogger("uvicorn.error")


def summarize_text_stream(payload):
    print("h")
    try:
        openrouter_payload = ({
            "model": "deepseek/deepseek-r1-zero:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that provides concise and accurate summaries."
                },
                {
                    "role": "user",
                    "content": f"Please provide a concise summary of the following text:\n\n{payload['inputs']}"
                }
            ],
            "stream": True
        })
        print(openrouter_payload)

        with requests.post(
            Summarization_URL,
            headers=headers,
            json=openrouter_payload,  # Using json instead of data for automatic serialization
            stream=True
        ) as response:

            # print("Summarization API response status: %s", response.status_code)
            # print("Summarization API response text: %s", response.text)

            if response.status_code != 200:
                raise Exception(f"Summarization API error, status code {
                                response.status_code}")

            # Iterate through the streamed response
            for chunk in response.iter_lines():
                if chunk:
                    decoded_chunk = chunk.decode('utf-8')
                    if decoded_chunk.startswith('data: '):
                        # Remove 'data: ' prefix
                        json_chunk = decoded_chunk[6:]
                        if json_chunk != '[DONE]':
                            try:
                                chunk_data = json.loads(json_chunk)
                                if 'choices' in chunk_data:
                                    delta = chunk_data['choices'][0].get(
                                        'delta', {})
                                    if 'content' in delta:
                                        yield delta['content']
                            except json.JSONDecodeError:
                                logger.error(
                                    f"Error decoding JSON chunk: {json_chunk}")
    except Exception as e:
        logger.error(f"Error in summarization service: {e}")
        raise Exception("Error in summarization service: " + str(e))
