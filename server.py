import os
import math
import random
from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder="templates", static_folder="static")
PORT = int(os.environ.get("PORT", 5000))

AIRPORTS = {
    "CAN": ["Guangzhou", "China", 23.3924, 113.2988, 8, "photo-1542838132-92c53300491e"],
    "PVG": ["Shanghai", "China", 31.1443, 121.8083, 8, "photo-1508672019048-805c876b67e2"],
    "PEK": ["Beijing", "China", 40.0799, 116.5976, 8, "photo-1599572411659-19a97379b32c"],
    "HKG": ["Hong Kong", "China", 22.3080, 113.9185, 8, "photo-1504609773096-104ff2c73ba4"],
    "SZX": ["Shenzhen", "China", 22.6393, 113.8107, 8, "photo-1589561284144-8c880813f56b"],
    "HGH": ["Hangzhou", "China", 30.2295, 120.4344, 8, "photo-1626078302251-247545ee0c46"],
    "CTU": ["Chengdu", "China", 30.5785, 103.9471, 8, "photo-1549428383-7c980998cfb5"],
    "CKG": ["Chongqing", "China", 29.7180, 106.6417, 8, "photo-1620050869688-661fe21b6685"],
    "XIY": ["Xi'an", "China", 34.4371, 108.7516, 8, "photo-1599818228519-0fb429b634cc"],
    "KMG": ["Kunming", "China", 25.1018, 102.9292, 8, "photo-1533420822648-522645607da1"],
    "JFK": ["New York", "USA", 40.6413, -73.7781, -5, "photo-1496442226666-8d4d0e62e6e9"],
    "LAX": ["Los Angeles", "USA", 34.0522, -118.2437, -8, "photo-1534274988757-a28bf1a57c17"],
    "LHR": ["London", "UK", 51.4700, -0.4543, 0, "photo-1513635269975-59663e0ac1ad"],
    "SIN": ["Singapore", "Singapore", 1.3644, 103.9915, 8, "photo-1525625293386-3fb0ad7c1ea6"],
    "NRT": ["Tokyo", "Japan", 35.7720, 140.3929, 9, "photo-1493976040374-85c8e12f0c0e"],
    "HND": ["Haneda", "Japan", 35.5494, 139.7798, 9, "photo-1503899036084-c55cdd92da26"],
    "CDG": ["Paris", "France", 49.0097, 2.5479, 1, "photo-1502602898657-3e91760cbb34"],
    "ICN": ["Seoul", "South Korea", 37.4602, 126.4407, 9, "photo-1538481199705-c710c4e965fc"],
    "BKK": ["Bangkok", "Thailand", 13.6900, 100.7501, 7, "photo-1508009603885-50cf7c579365"],
    "DXB": ["Dubai", "UAE", 25.2532, 55.3657, 4, "photo-1512453979798-5ea266f8880c"],
    "FRA": ["Frankfurt", "Germany", 50.0379, 8.5622, 1, "photo-1596422846543-75c6fc1f7f43"],
    "AMS": ["Amsterdam", "Netherlands", 52.3105, 4.7683, 1, "photo-1513694203232-719a280e022f"]
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def generate_flights(origin, dest, date):
    dist = haversine(AIRPORTS[origin][2], AIRPORTS[origin][3], AIRPORTS[dest][2], AIRPORTS[dest][3])
    flight_minutes = int((dist / 850) * 60) + 30
    duration_hours = flight_minutes // 60
    duration_mins = flight_minutes % 60
    if dist < 1200:
        base_price = int(350 + dist * 0.45)
    else:
        base_price = int(800 + dist * 0.68)
    flights = []
    airlines = ["China Eastern", "Air China", "China Southern", "Hainan Airlines"]
    codes = ["MU", "CA", "CZ", "HU"]
    depart_slots = [400, 580, 780, 1100]
    origin_tz = AIRPORTS[origin][4]
    dest_tz = AIRPORTS[dest][4]
    tz_diff_mins = (dest_tz - origin_tz) * 60
    for i in range(4):
        price = base_price + (i * 80) + random.randint(-40, 60)
        flight_id = f"{origin}{dest}{i}"
        prices = {
            "携程": int(price * random.uniform(0.98, 1.01)),
            "飞猪": int(price * random.uniform(0.97, 1.02)),
            "去哪儿": int(price * random.uniform(0.97, 1.01))
        }
        dep_m = depart_slots[i] + random.randint(-20, 30)
        arr_m_local = (dep_m + flight_minutes + tz_diff_mins) % 1440
        dep_time_str = f"{dep_m // 60:02d}:{dep_m % 60:02d}"
        arr_time_str = f"{arr_m_local // 60:02d}:{arr_m_local % 60:02d}"
        min_platform = min(prices, key=prices.get)
        avg = sum(prices.values()) / 3
        saving = int((avg - prices[min_platform]) / avg * 100)
        flights.append({
            "flight_id": flight_id,
            "flight_number": f"{codes[i%4]}{random.randint(2000,8999)}",
            "airline": airlines[i%4],
            "departure_time": dep_time_str,
            "arrival_time": arr_time_str,
            "duration": f"{duration_hours}h {duration_mins}m",
            "prices": prices,
            "min_platform": min_platform,
            "saving": max(2, saving)
        })
    return flights

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/healthz")
def healthz():
    return jsonify({"status": "ok"})

@app.route("/data/search", methods=["POST"])
def search():
    data = request.json
    origin = data.get("from_city")
    dest = data.get("to_city")
    date = data.get("date")
    if origin not in AIRPORTS or dest not in AIRPORTS:
        return jsonify({"status": "error", "message": "Airport not found"}), 400
    dist = int(haversine(AIRPORTS[origin][2], AIRPORTS[origin][3], AIRPORTS[dest][2], AIRPORTS[dest][3]))
    flights = generate_flights(origin, dest, date)
    return jsonify({"status": "ok", "distance_km": dist, "flights": flights})

@app.route("/data/destination/<code>")
def destination(code):
    if code not in AIRPORTS:
        return jsonify({"error": "Not found"}), 404
    city, country, _, _, _, img_id = AIRPORTS[code]
    return jsonify({
        "city": city,
        "country": country,
        "intro": f"Welcome to {city}, a premier global hub in {country}. Known for its iconic landmarks, vibrant culture, and world-class experiences.",
        "weather": {"temp": random.randint(18, 29), "condition": "Optimal Sky Condition"},
        "topAttractions": [f"{city} Historic Center", f"Famous {city} Panoramic Skyline", "National Cultural Heritage Site"],
        "bestTimeToVisit": "Spring and Late Autumn Seasons",
        "travelTips": "Local transportation is readily accessible across central districts.",
        "photoUrl": f"https://images.unsplash.com/{img_id}?auto=format&fit=crop&w=800&q=80",
        "foods": ["Signature traditional recipes", "Authentic gourmet local specialties"]
    })

users = {}

@app.route("/data/auth/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"status": "error", "message": "Credentials missing"}), 400
    if username in users:
        return jsonify({"status": "error", "message": "Username already taken"}), 400
    users[username] = {"username": username, "password": password, "saved_flights": []}
    return jsonify({"status": "ok", "user": {"username": username, "saved_flights": []}})

@app.route("/data/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if username in users and users[username]["password"] == password:
        return jsonify({"status": "ok", "user": {"username": username, "saved_flights": users[username]["saved_flights"]}})
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route("/data/watchlist", methods=["POST"])
def add_watchlist():
    data = request.json
    username = data.get("username")
    flight = data.get("flight")
    if username not in users:
        return jsonify({"status": "error", "message": "User not found"}), 404
    if not any(f["flight_id"] == flight["flight_id"] for f in users[username]["saved_flights"]):
        users[username]["saved_flights"].append(flight)
    return jsonify({"status": "ok", "user": {"username": username, "saved_flights": users[username]["saved_flights"]}})

@app.route("/data/watchlist/delete", methods=["POST"])
def delete_watchlist():
    data = request.json
    username = data.get("username")
    flight_id = data.get("flight_id")
    if username not in users:
        return jsonify({"status": "error", "message": "User not found"}), 404
    users[username]["saved_flights"] = [f for f in users[username]["saved_flights"] if f["flight_id"] != flight_id]
    return jsonify({"status": "ok", "user": {"username": username, "saved_flights": users[username]["saved_flights"]}})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
