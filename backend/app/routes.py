from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.scrapers.article_scraper import scrape_website
from app.scrapers.clean_data import clean_scraped_data
from app.services.summarization_service import summarization_and_return
import json
from app.services.counter_service import generate_opposite_perspective

router = APIRouter()


class ArticleRequest(BaseModel):
    summary: str  # summarized article text to generate opposite perspective


class ScrapURLRequest(BaseModel):
    url: str  # URL to scrape data from


@router.post("/generate-perspective")
def generate_ai_perspective(request: ArticleRequest):
    # returns opposite perspective of the article

    new_perspective = generate_opposite_perspective(request.summary)

    print(new_perspective)

    return {"perspective": new_perspective}


@router.post("/scrape-and-summarize")
async def scrape_article(article: ScrapURLRequest):

    # article.url is automatically validated as a non-null string
    data = scrape_website(article.url)
    clean = clean_scraped_data(data["scraped"])
    summary = summarization_and_return(clean)

    # Convert Python object to a JSON string(this will use double quotes)
    json_summary_string = json.dumps(summary)
    print("summary"+json_summary_string)

    if not article.url:
        raise HTTPException(status_code=422, detail="URL is required")
    return {"summary": f"{json_summary_string}"}
