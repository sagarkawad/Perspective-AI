import re
from trafilatura import extract
# def clean_scraped_data(raw_text):
#     """
#     Cleans the scraped text by removing unwanted characters, multiple spaces, and normalizing case.
#     """
#     if raw_text is None:
#         return None
#
#     # Remove excessive spaces and new lines
#     clean_text = re.sub(r'\s+', ' ', raw_text).strip()
#
#     # Remove special characters (keeping only letters, numbers, and spaces)
#     clean_text = re.sub(r'[^a-zA-Z0-9\s.,!?]', '', clean_text)
#
#     return clean_text.lower()  # Normalize to lowercase


def clean_scraped_data(html_content):
    # Extract clean text
    clean_text = extract(html_content, include_links=False,
                         include_tables=False, include_images=False)

    # Remove newline characters (\n)
    clean_text = clean_text.replace("\n", " ")
    return clean_text
