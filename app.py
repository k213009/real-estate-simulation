import numpy_financial as npf
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import difflib

app = Flask(__name__)
CORS(app)

# --- サーバー起動時に一度だけCSVを読み込む ---
try:
    land_data_df = pd.read_csv("land_data_okinawa.csv")
    print("沖縄県の地価データを正常に読み込みました。")
except FileNotFoundError:
    print("エラー: land_data_okinawa.csv が見つかりません。")
    land_data_df = None

# --- 定数設定 ---
STRUCTURE_DATA = {
    "RC": {"replacement_cost": 20, "useful_life": 47},
    "Steel": {"replacement_cost": 18.6, "useful_life": 34},
    "Wood": {"replacement_cost": 17.8, "useful_life": 22},
    "RC_Block": {"replacement_cost": 18, "useful_life": 38},
}
ELEVATOR_MAINTENANCE_COST = 40
WATER_TANK_CLEANING_COST = 5
LAND_CAP_RATES = {"Naha": 0.032, "Chunanbu": 0.034, "Hokubu": 0.035}
BUILDING_CAP_RATE = 0.055


# --- 住所から最も近い基準地の価格を探す関数 ---
def find_closest_land_price(user_address):
    if land_data_df is None or land_data_df.empty or not user_address:
        return 0, "地価データなし"
    addresses = land_data_df["所在地"].tolist()
    closest_matches = difflib.get_close_matches(
        user_address, addresses, n=1, cutoff=0.1
    )
    if not closest_matches:
        return 0, "該当する基準地なし"
    closest_address = closest_matches[0]
    matched_row = land_data_df[land_data_df["所在地"] == closest_address]
    price_per_sqm = matched_row["価格"].iloc[0]
    price_per_tsubo = price_per_sqm / 0.3025
    source_text = (
        f"近傍基準地: {closest_address} ({int(price_per_tsubo / 10000)}万円/坪)"
    )
    return price_per_sqm, source_text


# --- スコアリング関数 ---
def get_score(dscr, ltv):
    if dscr >= 1.4:
        dscr_cat = 0
    elif dscr >= 1.3:
        dscr_cat = 1
    elif dscr >= 1.2:
        dscr_cat = 2
    elif dscr >= 1.1:
        dscr_cat = 3
    elif dscr >= 1.0:
        dscr_cat = 4
    elif dscr >= 0.9:
        dscr_cat = 5
    elif dscr >= 0.8:
        dscr_cat = 6
    else:
        dscr_cat = 7
    if ltv <= 60:
        ltv_cat = 0
    elif ltv <= 80:
        ltv_cat = 1
    elif ltv <= 100:
        ltv_cat = 2
    elif ltv <= 120:
        ltv_cat = 3
    else:
        ltv_cat = 4
    score_matrix = [
        [100, 95, 90, 85, 75],
        [95, 90, 85, 80, 70],
        [85, 80, 75, 70, 60],
        [80, 75, 70, 65, 55],
        [75, 70, 65, 60, 50],
        [70, 65, 60, 55, 45],
        [65, 60, 55, 50, 40],
        [60, 55, 50, 45, 35],
    ]
    if ltv_cat >= len(score_matrix[0]):
        ltv_cat = len(score_matrix[0]) - 1
    return score_matrix[dscr_cat][ltv_cat]


# --- 銀行評価額の計算関数 ---
def calculate_bank_metrics(noi, land_eval_cost, building_value, region):
    cost_approach_value = land_eval_cost + building_value
    property_value_for_noi = (
        land_eval_cost + building_value if (land_eval_cost + building_value) > 0 else 1
    )
    noi_land = noi * (land_eval_cost / property_value_for_noi)
    noi_building = noi * (building_value / property_value_for_noi)
    land_cap_rate = LAND_CAP_RATES.get(region, 0.035)
    income_approach_value = (noi_land / land_cap_rate if land_cap_rate > 0 else 0) + (
        noi_building / BUILDING_CAP_RATE if BUILDING_CAP_RATE > 0 else 0
    )
    bank_appraisal_value = (cost_approach_value * 0.7) + (income_approach_value * 0.3)
    collateral_value = bank_appraisal_value * 0.8
    return (
        collateral_value,
        cost_approach_value,
        income_approach_value,
        bank_appraisal_value,
    )


# --- Aランクになる借入額を逆算する関数 ---
def find_a_rank_loan(data, noi_year1, collateral_value):
    loan_amount = data.get("loanAmount", 0)
    interest_rate = data.get("interestRate", 0)
    loan_term = data.get("loanTerm", 0)

    initial_loan_payment = (
        -1 * npf.pmt(interest_rate / 100 / 12, loan_term * 12, loan_amount) * 12
        if loan_amount > 0 and loan_term > 0 and interest_rate > 0
        else 0
    )
    initial_dscr = (
        noi_year1 / initial_loan_payment if initial_loan_payment > 0 else float("inf")
    )
    initial_ltv = (
        (loan_amount / collateral_value) * 100 if collateral_value > 0 else float("inf")
    )
    if get_score(initial_dscr, initial_ltv) >= 80:
        return loan_amount

    for test_loan in range(int(loan_amount), 0, -50):
        test_loan_payment = (
            -1 * npf.pmt(interest_rate / 100 / 12, loan_term * 12, test_loan) * 12
            if test_loan > 0
            else 0
        )
        test_dscr = (
            noi_year1 / test_loan_payment if test_loan_payment > 0 else float("inf")
        )
        test_ltv = (
            (test_loan / collateral_value) * 100
            if collateral_value > 0
            else float("inf")
        )
        if get_score(test_dscr, test_ltv) >= 80:
            return test_loan
    return 0


@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = {k: v or 0 for k, v in request.json.items()}

        # --- 1. 初期設定と自動計算 ---
        price_per_sqm, land_price_source = find_closest_land_price(
            data.get("address", "")
        )
        evaluated_land_cost = (price_per_sqm * data.get("landArea", 0)) / 10000

        property_price = data.get("buildingCost", 0) + data.get("landCost", 0)
        brokerage_fee = (
            (property_price * 0.03 + 6) if data.get("buildingAge", 0) > 0 else 0
        )
        stamp_duty = 6
        registration_tax = (
            property_price * 0.015 + data.get("loanAmount", 0) * 0.004 + 10
        )
        property_acquisition_tax = property_price * 0.03
        automated_other_costs = (
            brokerage_fee + stamp_duty + registration_tax + property_acquisition_tax
        )
        property_total_cost = (
            data.get("buildingCost", 0)
            + data.get("landCost", 0)
            + automated_other_costs
        )

        # --- 2. 初年度のシミュレーション ---
        yearly_loan_payment = 0
        if (
            data.get("loanAmount", 0) > 0
            and data.get("loanTerm", 0) > 0
            and data.get("interestRate", 0) > 0
        ):
            yearly_loan_payment = (
                -1
                * npf.pmt(
                    data.get("interestRate", 0) / 100 / 12,
                    data.get("loanTerm", 0) * 12,
                    data.get("loanAmount", 0),
                )
                * 12
            )

        structure_info = STRUCTURE_DATA.get(
            data.get("structure", "Wood"), STRUCTURE_DATA["Wood"]
        )
        building_replacement_cost = structure_info["replacement_cost"] * data.get(
            "buildingArea", 0
        )
        total_age_y1 = data.get("buildingAge", 0) + 1
        building_value_y1 = building_replacement_cost * max(
            0,
            (structure_info["useful_life"] - total_age_y1)
            / structure_info["useful_life"],
        )
        repair_rate_y1 = 0.007 if total_age_y1 <= 10 else 0.010

        year1_expenses = {
            "repair_cost": building_replacement_cost * repair_rate_y1 * 0.3,
            "property_tax": (data.get("landCost", 0) * 1 / 6) * 0.014
            + (building_value_y1 * 1 / 2) * 0.014,
            "fire_insurance": building_value_y1 * 0.001,
            "management_fee": data.get("rent", 0) * 0.05,
            "capital_expenditure": building_replacement_cost * repair_rate_y1 * 0.7,
            "utilities": 2.3 * data.get("rooms", 0),
            "elevator_cost": (
                ELEVATOR_MAINTENANCE_COST if data.get("hasElevator") == "yes" else 0
            ),
            "water_tank_cost": WATER_TANK_CLEANING_COST,
        }
        year1_expenses["total"] = sum(year1_expenses.values())
        noi_year1 = data.get("rent", 0) - year1_expenses["total"]
        cash_flow_y1 = noi_year1 - yearly_loan_payment

        # --- 3. 銀行評価額と主要指標の計算 ---
        (
            collateral_value,
            cost_approach_value,
            income_approach_value,
            bank_appraisal_value,
        ) = calculate_bank_metrics(
            noi_year1,
            evaluated_land_cost,
            building_value_y1,
            data.get("region", "Hokubu"),
        )
        ltv = (
            (data.get("loanAmount", 0) / collateral_value) * 100
            if collateral_value > 0
            else float("inf")
        )
        dscr = (
            noi_year1 / yearly_loan_payment if yearly_loan_payment > 0 else float("inf")
        )
        score = get_score(dscr, ltv)
        rank = (
            "A" if score >= 80 else "B" if score >= 60 else "D" if score < 40 else "C"
        )

        # --- 4. Aランク借入額と自己資金の計算 ---
        estimated_loan_amount = find_a_rank_loan(data, noi_year1, collateral_value)
        required_equity = property_total_cost - estimated_loan_amount

        # --- 5. 35年間の長期シミュレーション ---
        long_term_projection, cumulative_cash_flow = [], 0
        current_rent, current_loan_balance = data.get("rent", 0), data.get(
            "loanAmount", 0
        )

        for year in range(1, 36):
            total_age = data.get("buildingAge", 0) + year
            noi_projection = current_rent - year1_expenses["total"]
            current_loan_payment = (
                yearly_loan_payment if year <= data.get("loanTerm", 0) else 0
            )
            cash_flow_projection = noi_projection - current_loan_payment
            cumulative_cash_flow += cash_flow_projection
            if year <= data.get("loanTerm", 0) and data.get("loanAmount", 0) > 0:
                interest_paid = current_loan_balance * (
                    data.get("interestRate", 0) / 100
                )
                principal_paid = (
                    yearly_loan_payment - interest_paid
                    if yearly_loan_payment > interest_paid
                    else 0
                )
                current_loan_balance -= principal_paid
                current_loan_balance = max(0, current_loan_balance)
            else:
                current_loan_balance = 0
            building_current_value = building_replacement_cost * max(
                0,
                (structure_info["useful_life"] - total_age)
                / structure_info["useful_life"],
            )
            collateral_value_projection, _, _, _ = calculate_bank_metrics(
                noi_year1,
                evaluated_land_cost,
                building_current_value,
                data.get("region", "Hokubu"),
            )
            if year == 1 or year % 5 == 0:
                long_term_projection.append(
                    {
                        "year": year,
                        "cash_flow": round(cash_flow_projection, 0),
                        "loan_balance": round(current_loan_balance, 0),
                        "collateral_value": round(collateral_value_projection, 0),
                        "cumulative_cash_flow": round(cumulative_cash_flow, 0),
                    }
                )
            if total_age > 10 and year % 5 == 0:
                current_rent *= 1 - 0.01

        # --- 6. 最終的な指標を計算 ---
        surface_yield = (
            (data.get("rent", 0) / property_total_cost) * 100
            if property_total_cost > 0
            else 0
        )
        net_yield = (
            (noi_year1 / property_total_cost) * 100 if property_total_cost > 0 else 0
        )
        equity = (
            property_total_cost - data.get("loanAmount", 0)
            if property_total_cost > data.get("loanAmount", 0)
            else 1
        )
        cash_on_cash_return = (cash_flow_y1 / equity) * 100 if equity > 0 else 0
        total_outgoings_year1 = year1_expenses["total"] + yearly_loan_payment
        break_even_occupancy = (
            (total_outgoings_year1 / data.get("rent", 0)) * 100
            if data.get("rent", 0) > 0
            else 0
        )
        collateral_coverage_ratio = (
            (collateral_value / data.get("loanAmount", 0)) * 100
            if data.get("loanAmount", 0) > 0
            else float("inf")
        )
        unsecured_amount = max(0, data.get("loanAmount", 0) - collateral_value)

        # --- 7. Reactへの応答データを作成 ---
        response_data = {
            "market_price": round(property_total_cost, 0),
            "cost_approach_value": round(cost_approach_value, 0),
            "income_approach_value": round(income_approach_value, 0),
            "bank_appraisal_value": round(bank_appraisal_value, 0),
            "collateral_value": round(collateral_value, 0),
            "surface_yield": round(surface_yield, 2),
            "net_yield": round(net_yield, 2),
            "cash_flow": round(cash_flow_y1, 0),
            "dscr": round(dscr, 2),
            "ltv": round(ltv, 2),
            "score": score,
            "rank": rank,
            "long_term_projection": long_term_projection,
            "year1_expenses": {k: round(v, 2) for k, v in year1_expenses.items()},
            "yearly_revenue": round(data.get("rent", 0), 2),
            "yearly_loan_payment": round(yearly_loan_payment, 2),
            "break_even_occupancy": round(break_even_occupancy, 2),
            "cash_on_cash_return": round(cash_on_cash_return, 2),
            "collateral_coverage_ratio": round(collateral_coverage_ratio, 2),
            "unsecured_amount": round(unsecured_amount, 0),
            "estimated_loan_amount": round(estimated_loan_amount, 0),
            "required_equity": round(required_equity, 0),
            "user_loan_amount": data.get("loanAmount", 0),
            "cost_approach_breakdown": {
                "land": round(evaluated_land_cost, 0),
                "building": round(cost_approach_value - evaluated_land_cost, 0),
            },
            "funding_plan": {
                "building_cost": round(data.get("buildingCost", 0), 0),
                "land_cost": round(data.get("landCost", 0), 0),
                "other_costs_details": {
                    "brokerage_fee": round(brokerage_fee, 2),
                    "stamp_duty": round(stamp_duty, 2),
                    "registration_tax": round(registration_tax, 2),
                    "property_acquisition_tax": round(property_acquisition_tax, 2),
                    "total": round(automated_other_costs, 0),
                },
            },
            "land_price_source": land_price_source,
        }
        return jsonify(response_data)
    except Exception as e:
        print(f"計算エラー: {e}")
        return jsonify({"error": f"Calculation error: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
