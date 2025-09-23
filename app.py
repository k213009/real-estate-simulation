import numpy_financial as npf
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

STRUCTURE_DATA = {
    'RC': {'replacement_cost': 20, 'useful_life': 47},
    'Steel': {'replacement_cost': 18.6, 'useful_life': 34},
    'Wood': {'replacement_cost': 17.8, 'useful_life': 22},
    'RC_Block': {'replacement_cost': 18, 'useful_life': 38}
}
ELEVATOR_MAINTENANCE_COST = 40
WATER_TANK_CLEANING_COST = 5

def get_score(dscr, ltv):
    if dscr >= 1.4: dscr_cat = 0
    elif dscr >= 1.3: dscr_cat = 1
    elif dscr >= 1.2: dscr_cat = 2
    elif dscr >= 1.1: dscr_cat = 3
    elif dscr >= 1.0: dscr_cat = 4
    elif dscr >= 0.9: dscr_cat = 5
    elif dscr >= 0.8: dscr_cat = 6
    else: dscr_cat = 7
    if ltv <= 60: ltv_cat = 0
    elif ltv <= 80: ltv_cat = 1
    elif ltv <= 100: ltv_cat = 2
    elif ltv <= 120: ltv_cat = 3
    else: ltv_cat = 4
    score_matrix = [
        [100, 95, 90, 85, 75], [95, 90, 85, 80, 70], [85, 80, 75, 70, 60],
        [80, 75, 70, 65, 55], [75, 70, 65, 60, 50], [70, 65, 60, 55, 45],
        [65, 60, 55, 50, 40], [60, 55, 50, 45, 35]
    ]
    if ltv_cat >= len(score_matrix[0]): ltv_cat = len(score_matrix[0]) - 1
    return score_matrix[dscr_cat][ltv_cat]

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    try:
        rent = data.get('rent', 0) or 0
        building_cost = data.get('buildingCost', 0) or 0
        land_cost = data.get('landCost', 0) or 0
        other_costs = data.get('otherCosts', 0) or 0
        loan_amount = data.get('loanAmount', 0) or 0
        loan_term = data.get('loanTerm', 0) or 0
        interest_rate = data.get('interestRate', 0) or 0
        structure = data.get('structure', 'Wood')
        building_age = data.get('buildingAge', 0) or 0
        building_area = data.get('buildingArea', 0) or 0
        rooms = data.get('rooms', 0) or 0
        has_elevator = data.get('hasElevator', 'no')
        structure_info = STRUCTURE_DATA.get(structure)
        replacement_cost_per_sqm = structure_info['replacement_cost']
        useful_life = structure_info['useful_life']
        building_replacement_cost = replacement_cost_per_sqm * building_area
        depreciation_ratio = max(0, (useful_life - building_age) / useful_life)
        building_current_value = building_replacement_cost * depreciation_ratio
        repair_rate = 0.015
        if building_age <= 5: repair_rate = 0.005
        elif building_age <= 10: repair_rate = 0.007
        elif building_age <= 20: repair_rate = 0.010
        repair_cost = building_replacement_cost * repair_rate * 0.3
        land_tax = (land_cost * 1/6) * 0.014
        building_tax = (building_current_value * 1/2) * 0.014
        property_tax = land_tax + building_tax
        fire_insurance = building_current_value * 0.001
        management_fee = rent * 0.05
        capital_expenditure = building_replacement_cost * repair_rate * 0.7
        utilities = 2.3 * rooms
        elevator_cost = ELEVATOR_MAINTENANCE_COST if has_elevator == 'yes' else 0
        water_tank_cost = WATER_TANK_CLEANING_COST
        yearly_expenses = (repair_cost + property_tax + fire_insurance + management_fee + 
                           capital_expenditure + utilities + elevator_cost + water_tank_cost)
        property_total_cost = building_cost + land_cost + other_costs
        yearly_revenue = rent
        surface_yield = (yearly_revenue / property_total_cost) * 100 if property_total_cost > 0 else 0
        noi = yearly_revenue - yearly_expenses
        net_yield = (noi / property_total_cost) * 100 if property_total_cost > 0 else 0
        yearly_loan_payment = 0
        if loan_amount > 0 and loan_term > 0 and interest_rate > 0:
            monthly_payment = -1 * npf.pmt(interest_rate/100/12, loan_term*12, loan_amount)
            yearly_loan_payment = monthly_payment * 12
        cash_flow = noi - yearly_loan_payment
        dscr = noi / yearly_loan_payment if yearly_loan_payment > 0 else 0
        ltv = (loan_amount / property_total_cost) * 100 if property_total_cost > 0 else 0
        score = get_score(dscr, ltv)
        rank = 'C'
        if score >= 80: rank = 'A'
        elif score >= 60: rank = 'B'
        long_term_projection = [] # Temporarily empty
    except Exception as e:
        print(f"計算エラー: {e}")
        return jsonify({"error": str(e)}), 500
    response_data = {
        "message": "スコアリング計算が完了しました",
        "surface_yield": round(surface_yield, 2),
        "net_yield": round(net_yield, 2),
        "cash_flow": round(cash_flow, 0),
        "dscr": round(dscr, 2),
        "ltv": round(ltv, 2),
        "score": score,
        "rank": rank,
        "long_term_projection": long_term_projection
    }
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)