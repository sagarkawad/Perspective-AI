from openai import OpenAI
import base64
import os
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI()


def openai_voice(input_text):
    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",  # Updated to the correct model name
        voice="coral",  # You can change this to "echo", "fable", "onyx", "nova", "shimmer" if needed
        input=input_text,
        response_format="mp3"  # Ensure we get MP3 format
    )

    # Get the binary audio data
    audio_data = response.content

    # Convert to base64
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')

    # Return as a data URL that can be used directly in HTML audio elements
    return f"data:audio/mp3;base64,{audio_base64}"
