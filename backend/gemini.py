import os
import json
import urllib.request

def get_gemini_travel_details(city, country):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json", "User-Agent": "aistudio-build"}
    prompt = f"""You are a travel assistant. Generate travel guide details for {city}, {country} in structured JSON format. Respond ONLY with raw JSON:
{{
 "city": "{city}",
 "country": "{country}",
 "intro": "short overview",
 "weather": {{
   "temp": 25, "condition": "Sunny", "humidity": 60, "windSpeed": 12,
   "forecast": [
     {{"day": "Tomorrow", "temp": 26, "condition": "Sunny"}},
     {{"day": "Day After", "temp": 24, "condition": "Cloudy"}},
     {{"day": "In 3 Days", "temp": 25, "condition": "Sunny"}}
   ]
 }},
 "topAttractions": ["Place 1", "Place 2", "Place 3"],
 "bestTimeToVisit": "Spring",
 "travelTips": "Use local transport."
}}"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=12) as response:
            res_content = json.loads(response.read().decode('utf-8'))
            text = res_content['candidates'][0]['content']['parts'][0]['text']
            return json.loads(text.strip())
    except Exception as e:
        print("Gemini API error:", e)
        return None