import json
import requests
from tqdm import tqdm
import time

# 🔑 Your API credentials
API_KEY = "AIzaSyCUE9KnhIXhO5RpqE17LWXHSLDBHzAfGxQ"
SEARCH_ENGINE_ID = "51d66a773fca745c3"

def get_google_image_url(name, gender):
    """Return the first valid image URL from Google Custom Search API."""
    # Add gender to query + block bad sites
    query = (
        f"{name} {gender} perfume bottle "
        "-site:fragrantica.com "
        "-site:basenotes.net "
        "-site:parfumo.net "
        "-site:shopify.com "
        "-site:hiddensamples.com "
        "-site:shopatshowcaseusa.com"
    )

    params = {
        "q": query,
        "cx": SEARCH_ENGINE_ID,
        "key": API_KEY,
        "searchType": "image",
        "num": 1,  # 1 = first result only
        "safe": "high",
    }

    try:
        response = requests.get("https://www.googleapis.com/customsearch/v1", params=params)
        data = response.json()

        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["link"]
    except Exception as e:
        print(f"❌ Error fetching image for {name}: {e}")

    return None


# 📂 Load your perfume data
with open(r"C:\Users\aabou\Desktop\FirstREACT\FirstREACT\public\perfumes.json", "r", encoding="utf-8") as f:
    perfumes = json.load(f)

# 🧠 Fetch image URLs (test with 10 perfumes first)
for perfume in tqdm(perfumes[:10]):  # use [:10] for testing; remove for full run
    name = perfume.get("Name") or perfume.get("name") or perfume.get("title")
    gender = perfume.get("Gender") or perfume.get("gender", "")
    if not name:
        continue

    image_url = get_google_image_url(name, gender)
    perfume["image_url"] = image_url
    time.sleep(1.5)  # delay to avoid rate limiting (adjust between 1.2–1.5s for speed)

# 💾 Save updated file
with open("perfumes_with_images.json", "w", encoding="utf-8") as f:
    json.dump(perfumes, f, ensure_ascii=False, indent=2)

print("✅ Done! Added valid image URLs while excluding bad sources.")
