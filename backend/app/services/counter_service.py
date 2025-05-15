import logging
import requests
from app.prompts.opposite_perspective import get_opposite_perspective_prompt
from dotenv import load_dotenv
import os
import json

load_dotenv()
API_KEY = os.getenv("API_KEY")


logger = logging.getLogger("uvicorn.error")

PERSPECTIVE_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def generate_opposite_perspective(article_text):
    try:

        final_prompt = get_opposite_perspective_prompt(article_text)

        payload = {
            "model": "deepseek/deepseek-r1-zero:free",
            "messages": [
                {
                    "role": "user",
                    "content": final_prompt
                }
            ],
            "stream": True

        }

        with requests.post(
            PERSPECTIVE_URL,
            headers=headers,
            json=payload,
            stream=True
        )as response:
            if response.status_code != 200:
                raise Exception(f"Opposite perspective error status code {
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

        # response = requests.post(PERSPECTIVE_URL, headers=headers, json=payload)
        # result = response.json()['choices'][0]['message']['content']
        #
        # perspective_raw = result.split("[RESPONSE]")[-1].strip()
        #
        # if "Opposite Perspective:" in perspective_raw:
        #     # format the response
        #     perspective = perspective_raw.replace(
        #         "Opposite Perspective:", "**Opposite Perspective:**\n")
        # else:
        #     perspective = f"**Opposite Perspective:**\n {perspective_raw}"
        # return perspective
    except Exception as e:
        logger.error(f"Error in perspective service: {e}")
        raise Exception("Error in perspective service: " + str(e))
