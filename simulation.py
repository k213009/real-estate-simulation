import pandas as pd
import Levenshtein as lev
import os

# CSVファイルのパスを設定
csv_file_path = '202507基準地.csv'

# CSVファイルを読み込む
try:
    df = pd.read_csv(csv_file_path, encoding='cp932', header=2)
    print("CSVファイルの読み込みに成功しました。")
    print("列名:", df.columns.tolist())
except FileNotFoundError:
    print(f"エラー: ファイル '{csv_file_path}' が見つかりません。")
    print("CSVファイルがプロジェクトフォルダに正しく配置されているか確認してください。")
    exit()

def get_land_price(user_address):
    """
    入力された住所に最も近い基準地の価格を取得する関数
    """
    required_columns = ['基準地の所在', '1㎡あたりの価格(円)']
    if not all(col in df.columns for col in required_columns):
        print("エラー: 必要な列が見つかりません。CSVの列名が正しいか確認してください。")
        return None

    df['基準地の所在'] = df['基準地の所在'].astype(str)

    df['distance'] = df['基準地の所在'].apply(lambda x: lev.distance(x, user_address))

    closest_match = df.loc[df['distance'].idxmin()]

    print("\n--- 住所マッチング結果 ---")
    print(f"入力された住所: {user_address}")
    print(f"最も近い基準地: {closest_match['基準地の所在']}")
    print(f"価格: {closest_match['1㎡あたりの価格(円)']}円/㎡")

    return closest_match['1㎡あたりの価格(円)']

test_address = '那覇市松尾1-15-11'
price = get_land_price(test_address)

if price is not None:
     # 1. カンマを削除
    price_no_comma = price.replace(',', '')

    # 2. 文字列を整数(int)に変換
    price_numeric = int(price_no_comma)
    
    # 3. 数字になった価格で計算
    land_area = 100
    total_land_price = price_numeric * land_area
    
    # 4. 結果を表示
    print(f"仮の土地価格: {total_land_price:,}円")