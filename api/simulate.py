from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # Reactからアクセスできるようにする

# CSV読み込み
land_data_df = pd.read_csv("api/land_data_okinawa.csv")  # CSVは /api 内に置く


@app.route("/api/simulate", methods=["POST"])
def simulate():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON data received"}), 400

    response_data = {"message": "サーバーレス関数が動いています"}
    return jsonify(response_data)
