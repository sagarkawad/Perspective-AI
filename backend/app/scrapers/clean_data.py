from trafilatura import extract


def clean_scraped_data(html_content):
    # Extract clean text
    clean_text = extract(html_content, include_links=False,
                         include_tables=False, include_images=False)

    # Remove newline characters (\n)
    clean_text = clean_text.replace("\n", " ")
    return clean_text
