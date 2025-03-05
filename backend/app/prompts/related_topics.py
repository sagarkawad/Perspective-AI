RELATED_TOPICS_PROMPT = """
You are an expert content analyst specializing in identifying nuanced and interconnected themes within articles. 

Guidelines:
- Identify 5-7 topics closely related to the original article's core themes
- For each topic, provide:
  1. A clear, concise topic name
  2. Two distinct perspectives
  3. Potential research or source directions

Input Article Summary:
{article_text}

Output Requirements:
- Maintain academic rigor and intellectual depth
- Ensure perspectives offer genuine alternative viewpoints
- Provide actionable research directions

Format your response as a structured list of related topics with their perspectives.
"""

def get_related_topics_prompt(article_text: str) -> str:
    """
    Formats the prompt for generating related topics by injecting the provided article text.
    """
    return RELATED_TOPICS_PROMPT.format(article_text=article_text)