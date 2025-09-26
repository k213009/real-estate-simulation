from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# 最もシンプルなCORS設定に戻します
CORS(app)


@app.route("/api/simulate", methods=["POST"])
def simulate():
    # 受け取ったデータも念のためログに出力してみます
    try:
        data = request.json
        print(f"データを受信しました: {data}")
    except Exception as e:
        print(f"データ受信エラー: {e}")

    # どんなリクエストにも、必ずこの成功メッセージを返します
    response_data = {
        "message": "テスト成功！APIは正常に動作しています。",
        "finalProfit": 12345,  # フロントエンドが表示を試みるデータ
        "monthlyPayment": 1000,
        "yearlyCashFlowAfterTax": 2000,
        "totalCashFlow": 3000,
        "landPrice": 4000,
    }
    return jsonify(response_data)


# Vercelでは不要ですが、ローカルテスト用に残します
if __name__ == "__main__":
    app.run(debug=True)
