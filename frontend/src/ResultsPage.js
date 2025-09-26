import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ツールチップ付きの指標コンポーネント
const MetricWithTooltip = ({ label, tooltipText }) => (
  <TooltipContainer>
    {label}
    <TooltipIcon>?</TooltipIcon>
    <TooltipText>{tooltipText}</TooltipText>
  </TooltipContainer>
);

function ResultsPage() {
  const location = useLocation();
  const result = location.state?.result;
  const [showExpenses, setShowExpenses] = useState(false);
  const [showFundingExpenses, setShowFundingExpenses] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const safeGet = (obj, path, defaultValue = 0) => {
    const keys = Array.isArray(path) ? path : path.split('.');
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : defaultValue, obj);
  };

  if (!result) {
    return (
        <PageContainer>
            <ResultsContainer>
                <Header><h1>結果がありません</h1></Header>
                <p style={{textAlign: 'center'}}>シミュレーションデータが見つかりません。入力画面から再度実行してください。</p>
                <BackLink to="/">入力画面に戻る</BackLink>
            </ResultsContainer>
        </PageContainer>
    );
  }

  const projectionData = result.long_term_projection || [];
  const labels = projectionData.map(d => `${d.year}年目`);

  const chartData = {
    labels,
    datasets: [
      {
        label: '年間キャッシュフロー (万円)',
        data: projectionData.map(d => d.cash_flow),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'ローン残高 (万円)',
        data: projectionData.map(d => d.loan_balance),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: '保全価格 (万円)',
        data: projectionData.map(d => d.collateral_value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: 'キャッシュフロー累積 (万円)',
        data: projectionData.map(d => d.cumulative_cash_flow),
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: {
            position: 'bottom',
        },
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '年間キャッシュフロー (万円)' }},
      y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'ローン残高 / 評価額 / CF累積 (万円)' }, grid: { drawOnChartArea: false }},
    },
  };

  return (
    <PageContainer>
      <ResultsContainer>
        <Header>
          <h1>うちなー収益物件シミュレーター 結果</h1>
        </Header>
        
        {/* ( ... 各セクションは変更なし ... ) */}
        <Section>
            <SectionTitle>ご入力の条件でのシミュレーション結果</SectionTitle>
            <SubTitle>(借入金額: {safeGet(result, 'user_loan_amount', 0).toLocaleString()} 万円)</SubTitle>
            <SummaryGrid>
              <MetricCard>
                <h3><MetricWithTooltip label="総合ランク" tooltipText="80点以上: A, 60-79点: B, 40-59点: C, 39点以下: D" /></h3>
                <p className={`rank-${result.rank}`}>{result.rank}</p>
              </MetricCard>
              <MetricCard>
                <h3><MetricWithTooltip label="スコア" tooltipText="DSCRとLTVから算出される、投資の安全性を表す総合得点です（100点満点）" /></h3>
                <p>{result.score} 点</p>
              </MetricCard>
              <MetricCard>
                <h3><MetricWithTooltip label="年間キャッシュフロー" tooltipText="家賃収入から全ての支出（経費やローン返済）を差し引いた後、最終的に手元に残るお金のことです。" /></h3>
                <p>{safeGet(result, 'cash_flow', 0).toLocaleString()} 万円</p>
              </MetricCard>
            </SummaryGrid>
        </Section>
        
        <Section>
            <SectionTitle>Aランクを目指す場合の資金計画（目安）</SectionTitle>
             <FundingPlanGrid>
                <FundingDetails>
                    <h4>【費用】</h4>
                    <p><span>建物価格:</span><span>{safeGet(result, 'funding_plan.building_cost', 0).toLocaleString()} 万円</span></p>
                    <p><span>土地価格:</span><span>{safeGet(result, 'funding_plan.land_cost', 0).toLocaleString()} 万円</span></p>
                    <p>
                        <div>
                            <span>諸費用合計:</span>
                            <DetailsToggle onClick={() => setShowFundingExpenses(!showFundingExpenses)}>{showFundingExpenses ? '隠す' : '詳細'}</DetailsToggle>
                        </div>
                        <span>{safeGet(result, 'funding_plan.other_costs_details.total', 0).toLocaleString()} 万円</span>
                    </p>
                    <ExpenseDetails isOpen={showFundingExpenses} isSubItem={true}>
                        <ExpenseItem><div>仲介手数料:</div><div>{safeGet(result, 'funding_plan.other_costs_details.brokerage_fee', 0).toLocaleString()} 万円</div></ExpenseItem>
                        <ExpenseItem><div>印紙代:</div><div>{safeGet(result, 'funding_plan.other_costs_details.stamp_duty', 0).toLocaleString()} 万円</div></ExpenseItem>
                        <ExpenseItem><div>登記費用:</div><div>{safeGet(result, 'funding_plan.other_costs_details.registration_tax', 0).toLocaleString()} 万円</div></ExpenseItem>
                        <ExpenseItem><div>不動産取得税:</div><div>{safeGet(result, 'funding_plan.other_costs_details.property_acquisition_tax', 0).toLocaleString()} 万円</div></ExpenseItem>
                    </ExpenseDetails>
                    <hr />
                    <p><strong>総費用合計</strong><strong>{safeGet(result, 'market_price', 0).toLocaleString()} 万円</strong></p>
                </FundingDetails>
                <FundingDetails>
                    <h4>【調達】</h4>
                    <p><MetricWithTooltip label="借入可能額（目安）" tooltipText="総合ランクがA(80点以上)となる、借入額の上限の目安です。この金額であれば、銀行から資金調達できる可能性が高いと判断できます。" /><span>{safeGet(result, 'estimated_loan_amount', 0).toLocaleString()} 万円</span></p>
                    <p><MetricWithTooltip label="必要自己資金額（目安）" tooltipText="物件の総費用合計から、上記の借入可能額を差し引いた金額です。最低限この程度の自己資金が必要になる可能性があります。" /><span>{safeGet(result, 'required_equity', 0).toLocaleString()} 万円</span></p>
                    <hr />
                    <p><strong>調達資金合計</strong><strong>{(safeGet(result, 'estimated_loan_amount', 0) + safeGet(result, 'required_equity', 0)).toLocaleString()} 万円</strong></p>
                </FundingDetails>
            </FundingPlanGrid>
        </Section>

        <Section>
          <SectionTitle>物件評価額の比較</SectionTitle>
          <DetailsTable>
             <p><MetricWithTooltip label="市場価格（購入価格）" tooltipText="あなたが入力した、この物件の市場での取引価格です。全ての利回りは、この価格を基準に計算されます。" /><span>{safeGet(result, 'market_price', 0).toLocaleString()} 万円</span></p>
             <p><MetricWithTooltip label="積算価格" tooltipText={safeGet(result, 'land_price_source', '基準地データが見つかりませんでした')} /><span>{safeGet(result, 'cost_approach_value', 0).toLocaleString()} 万円</span></p>
             <ExpenseDetails isOpen={true} isSubItem={true} style={{paddingLeft: '10px'}}><ExpenseItem><div>土地(評価):</div><div>{safeGet(result, 'cost_approach_breakdown.land', 0).toLocaleString()} 万円</div></ExpenseItem><ExpenseItem><div>建物(評価):</div><div>{safeGet(result, 'cost_approach_breakdown.building', 0).toLocaleString()} 万円</div></ExpenseItem></ExpenseDetails>
             <p><MetricWithTooltip label="収益価格" tooltipText="この物件の年間の収益力から逆算した価値です。" /><span>{safeGet(result, 'income_approach_value', 0).toLocaleString()} 万円</span></p>
             <p><MetricWithTooltip label="銀行採用評価額" tooltipText="積算価格(70%)と収益価格(30%)を加味した、銀行が融資判断のベースとする評価額です。" /><span>{safeGet(result, 'bank_appraisal_value', 0).toLocaleString()} 万円</span></p>
             <p><MetricWithTooltip label="保全価格" tooltipText="銀行採用評価額に、さらに保守的な掛け目（80%）を乗じた、最終的な担保評価額です。" /><span>{safeGet(result, 'collateral_value', 0).toLocaleString()} 万円</span></p>
          </DetailsTable>
        </Section>
        
        <Section>
          <SectionTitle>初年度収支詳細</SectionTitle>
          <DetailsTable>
            <p><strong>家賃収入</strong><span>{safeGet(result, 'yearly_revenue', 0).toLocaleString()} 万円</span></p>
            <p>
              <div><strong>経費合計</strong><DetailsToggle onClick={() => setShowExpenses(!showExpenses)}>{showExpenses ? '隠す' : '詳細'}</DetailsToggle></div>
              <span>- {safeGet(result, 'year1_expenses.total', 0).toLocaleString()} 万円</span>
            </p>
            <ExpenseDetails isOpen={showExpenses}>
              <ExpenseItem><div>管理手数料:</div><div>{safeGet(result, 'year1_expenses.management_fee', 0).toLocaleString()} 万円</div></ExpenseItem>
              <ExpenseItem><div>固定資産税:</div><div>{safeGet(result, 'year1_expenses.property_tax', 0).toLocaleString()} 万円</div></ExpenseItem>
              <ExpenseItem><div>修繕費:</div><div>{safeGet(result, 'year1_expenses.repair_cost', 0).toLocaleString()} 万円</div></ExpenseItem>
              <ExpenseItem><div>資本的支出(大規模修繕積立):</div><div>{safeGet(result, 'year1_expenses.capital_expenditure', 0).toLocaleString()} 万円</div></ExpenseItem>
              <ExpenseItem><div>火災保険料:</div><div>{safeGet(result, 'year1_expenses.fire_insurance', 0).toLocaleString()} 万円</div></ExpenseItem>
              <ExpenseItem><div>共用電気水道料:</div><div>{safeGet(result, 'year1_expenses.utilities', 0).toLocaleString()} 万円</div></ExpenseItem>
              {safeGet(result, 'year1_expenses.elevator_cost', 0) > 0 && <ExpenseItem><div>エレベーター維持費:</div><div>{result.year1_expenses.elevator_cost.toLocaleString()} 万円</div></ExpenseItem>}
              <ExpenseItem><div>貯水槽清掃費:</div><div>{safeGet(result, 'year1_expenses.water_tank_cost', 0).toLocaleString()} 万円</div></ExpenseItem>
            </ExpenseDetails>
            <p><strong>ローン返済額</strong><span>- {safeGet(result, 'yearly_loan_payment', 0).toLocaleString()} 万円</span></p>
            <hr style={{border: 'none', borderBottom: '1px solid #ccc', margin: '5px 0'}}/>
            <p><strong>年間キャッシュフロー</strong><span>{safeGet(result, 'cash_flow', 0).toLocaleString()} 万円</span></p>
          </DetailsTable>
        </Section>

        <Section>
          <SectionTitle>主要指標</SectionTitle>
          <DetailsTable>
             <p><MetricWithTooltip label="表面利回り" tooltipText="物件価格に対する年間家賃収入の割合。経費は考慮しない大まかな指標です。沖縄では新築なら5%以上、中古なら6%以上が一つの目安とされます。" /><span>{safeGet(result, 'surface_yield', 0)} %</span></p>
             <p><MetricWithTooltip label="実質利回り" tooltipText="経費を差し引いた後の、より現実に近い利回りです。この数値が高いほど収益性が高いと言えます。" /><span>{safeGet(result, 'net_yield', 0)} %</span></p>
             <p><MetricWithTooltip label="自己資金収益率(CCR)" tooltipText="投下した自己資金に対して、どれだけのリターン(年間CF)があったかを示す指標。20%以上が理想とされます。" /><span>{safeGet(result, 'cash_on_cash_return', 0)} %</span></p>
             <p><MetricWithTooltip label="DSCR" tooltipText="ローン返済の安全性を測る指標。家賃収入でローンをどれだけカバーできるかを示します。銀行融資では1.1以上が求められることが多いです。" /><span>{safeGet(result, 'dscr', 0)}</span></p>
             <p><MetricWithTooltip label="LTV（対保全価格）" tooltipText="銀行の最終的な担保評価である「保全価格」に対する借入金の割合。銀行はこの指標を重視し、100%以下であることが望ましいです。" /><span>{safeGet(result, 'ltv', 0)} %</span></p>
             <p><MetricWithTooltip label="担保充足率" tooltipText="借入金額を保全価格でどれだけカバーできているかを示す割合。100%以上であれば、物件の担保価値だけで借入金をカバーできていることを意味します。" /><span>{safeGet(result, 'collateral_coverage_ratio', 0)} %</span></p>
             <p><MetricWithTooltip label="無担保額" tooltipText="借入金額のうち、保全価格でカバーしきれていない部分の金額。この金額が少ないほど、融資審査上有利になります。" /><span>{safeGet(result, 'unsecured_amount', 0).toLocaleString()} 万円</span></p>
             <p><MetricWithTooltip label="損益分岐点入居率" tooltipText="最低限どれくらいの入居率があれば赤字にならないかを示す割合。この数値が低いほど、空室に強い物件と言えます。" /><span>{safeGet(result, 'break_even_occupancy', 0)} %</span></p>
          </DetailsTable>
        </Section>
        
        <Section>
          <SectionTitle>長期収支シミュレーション (35年)</SectionTitle>
          <Line options={chartOptions} data={chartData} />
          
          {/* --- ▼▼▼ ここに注記事項を追加 ▼▼▼ --- */}
          <NotesSection>
            <h4>【シミュレーションの前提条件】</h4>
            <ul>
              <li>① キャッシュフローは、所得税・住民税といった税金や、会計上の減価償却費を考慮していない**税引前の数値**です。</li>
              <li>② 長期シミュレーションでは、**経費は初年度の金額で35年間一定**とし、**家賃収入のみが築10年目以降、5年ごとに1%ずつ下落**するモデルで計算しています。</li>
              <li>③ この長期シミュレーションは多くの仮定に基づいた簡易的な予測であり、将来の収益を保証するものではありません。**あくまで参考としてご活用ください。**</li>
            </ul>
          </NotesSection>
        </Section>

        <BackLink to="/">別の物件でシミュレーションする</BackLink>
      </ResultsContainer>
    </PageContainer>
  );
}

// --- styled-componentsの定義 ---
const PageContainer = styled.div` background-color: #f0f2f5; padding: 20px; font-family: 'Helvetica Neue', Arial, sans-serif; `;
const ResultsContainer = styled.div` max-width: 900px; margin: 20px auto; `;
const Section = styled.div` margin-bottom: 20px; padding: 25px; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); `;
const Header = styled.div` text-align: center; margin-bottom: 30px; h1 { margin-top: 0; color: #007bff; font-weight: 600; } `;
const SummaryGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; `;
const MetricCard = styled(Section)` padding: 20px; text-align: center; h3 { margin-top: 0; color: #555; font-size: 16px; font-weight: normal; } p { font-size: 36px; font-weight: bold; margin: 10px 0; border: none; } .rank-A { color: #4CAF50; } .rank-B { color: #FFC107; } .rank-C { color: #f44336; } .rank-D { color: #757575; } `;
const DetailsTable = styled.div` p { font-size: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 12px 5px; margin: 0; } p:last-child { border-bottom: none; } span { font-weight: bold; } div { display: flex; align-items: center; } `;
const ExpenseDetails = styled.div` padding-left: ${props => (props.isSubItem ? '10px' : '20px')}; border-left: 3px solid #eee; margin: 10px 0; max-height: ${props => (props.isOpen ? '500px' : '0')}; overflow: hidden; transition: max-height 0.5s ease-in-out; `;
const ExpenseItem = styled.div` color: #666; font-size: 15px; padding: 8px 5px; display: flex; justify-content: space-between; border-bottom: 1px dotted #f0f0f0; &:last-child { border-bottom: none; } `;
const DetailsToggle = styled.button` background: none; border: 1px solid #007bff; color: #007bff; padding: 2px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; margin-left: 15px; &:hover { background: #007bff; color: #fff; } `;
const TooltipIcon = styled.span` cursor: help; color: #007bff; margin-left: 8px; border: 1px solid #007bff; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold; `;
const TooltipText = styled.div` visibility: hidden; width: 280px; background-color: #333; color: #fff; text-align: left; border-radius: 6px; padding: 10px; position: absolute; z-index: 10; bottom: 125%; left: 50%; margin-left: -140px; opacity: 0; transition: opacity 0.3s; font-size: 14px; line-height: 1.5; &::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #333 transparent transparent transparent; } `;
const TooltipContainer = styled.div` position: relative; display: inline-flex; align-items: center; &:hover ${TooltipText} { visibility: visible; opacity: 1; } `;
const SectionTitle = styled.h2` margin-top: ${props => (props.sub ? '30px' : '0')}; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; font-weight: 600; font-size: 20px; `;
const SubTitle = styled.h3` text-align: center; color: #555; font-weight: normal; margin-top: -10px; margin-bottom: 20px; font-size: 16px; `;
const BackLink = styled(Link)` display: block; text-align: center; margin: 40px auto 0; padding: 12px; font-size: 18px; color: #007bff; text-decoration: none; border-radius: 8px; border: 1px solid #007bff; max-width: 400px; transition: background-color 0.2s, color 0.2s; &:hover { background-color: #007bff; color: #fff; } `;
const FundingPlanGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; padding: 10px 0; `;
const FundingDetails = styled.div` h4 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; color: #555; } p { font-size: 16px; display: flex; justify-content: space-between; padding: 8px 0; margin: 0; border: none; } hr { border: none; border-top: 2px solid #333; margin: 10px 0; } strong { font-size: 18px; } `;
// --- ▼▼▼ 注記用のスタイルを追加 ▼▼▼ ---
const NotesSection = styled.div`
  margin-top: 25px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  font-size: 14px;
  color: #555;
  
  h4 {
    margin-top: 0;
    font-size: 15px;
    color: #333;
  }

  ul {
    padding-left: 20px;
    margin: 0;
  }

  li {
    margin-bottom: 8px;
    line-height: 1.6;
  }
`;

export default ResultsPage;