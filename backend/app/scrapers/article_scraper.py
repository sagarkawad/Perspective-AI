import requests
from readability import Document


def scrape_website(url):
    response = requests.get(url)
    doc = Document(response.text)
    return {"title": doc.title(),
            "scraped": doc.summary()}
