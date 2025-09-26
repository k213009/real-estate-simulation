import React, { useState } from "react";
import axios from "axios"; // axiosをインポート
import ResultsPage from "./ResultsPage";
import styled from "styled-components";

// (styled-componentsの定義は変更ありません)
const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-weight: bold;
`;

// InputFormコンポーネント
const InputForm = () => {
  const [formData, setFormData] = useState({
    buildingCost: 20000,
    landCost: 10000,
    buildingArea: 1080,
    landArea: 600,
    structure: "RC",
    buildingAge: 10,
    rooms: 24,
    rent: 1440,
    loanAmount: 28000,
    interestRate: 2,
    loanTerm: 30,
    region: "Naha",
    address: "沖縄県那覇市おもろまち4",
    hasElevator: "yes",
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? value : type === "checkbox" ? checked : value,
    }));
  };

  const handleDemoData = () => {
    setFormData({
      buildingCost: 20000,
      landCost: 10000,
      buildingArea: 1080,
      landArea: 600,
      structure: "RC",
      buildingAge: 10,
      rooms: 24,
      rent: 1440,
      loanAmount: 28000,
      interestRate: 2,
      loanTerm: 30,
      region: "Naha",
      address: "沖縄県那覇市おもろまち4",
      hasElevator: "yes",
    });
  };

  // --- ここからが修正箇所 ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォームのデフォルト送信を防ぐ
    setIsLoading(true);
    setResult(null);
    setError(null);

    // Vercelの本番環境URLを自動で設定
    const apiUrl =
      process.env.NODE_ENV === "production"
        ? "https://real-estate-simulation-six.vercel.app/api/simulate"
        : "/api/simulate";

    // 入力値を数値に変換
    const numericData = {};
    for (const key in formData) {
      if (
        typeof formData[key] === "string" &&
        !isNaN(parseFloat(formData[key])) &&
        key !== "address" &&
        key !== "structure" &&
        key !== "region" &&
        key !== "hasElevator"
      ) {
        numericData[key] = parseFloat(formData[key]);
      } else {
        numericData[key] = formData[key];
      }
    }

    try {
      // axios を使ったPOSTリクエスト
      const response = await axios.post(apiUrl, numericData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(
        "サーバーとの通信でエラーが発生しました: " +
          (err.response ? err.response.data.error : err.message)
      );
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  // --- ここまでが修正箇所 ---

  return (
    <div>
      <FormContainer>
        <form onSubmit={handleSubmit}>
          <h2>物件情報</h2>
          {Object.keys(formData).map((key) => {
            if (key === "hasElevator") {
              return (
                <FormGroup key={key}>
                  <Label>エレベーターの有無</Label>
                  <input
                    type="radio"
                    id="elevatorYes"
                    name="hasElevator"
                    value="yes"
                    checked={formData.hasElevator === "yes"}
                    onChange={handleChange}
                  />
                  <label htmlFor="elevatorYes">あり</label>
                  <input
                    type="radio"
                    id="elevatorNo"
                    name="hasElevator"
                    value="no"
                    checked={formData.hasElevator === "no"}
                    onChange={handleChange}
                  />
                  <label htmlFor="elevatorNo">なし</label>
                </FormGroup>
              );
            }
            // 他の入力フィールドをレンダリング
            let label = key;
            switch (key) {
              case "buildingCost":
                label = "建物価格(万円)";
                break;
              case "landCost":
                label = "土地価格(万円)";
                break;
              case "buildingArea":
                label = "建物面積(㎡)";
                break;
              case "landArea":
                label = "土地面積(㎡)";
                break;
              case "structure":
                label = "構造";
                break;
              case "buildingAge":
                label = "築年数(年)";
                break;
              case "rooms":
                label = "戸数";
                break;
              case "rent":
                label = "年間想定家賃収入(万円)";
                break;
              case "loanAmount":
                label = "借入金額(万円)";
                break;
              case "interestRate":
                label = "金利(%)";
                break;
              case "loanTerm":
                label = "借入期間(年)";
                break;
              case "region":
                label = "地域";
                break;
              case "address":
                label = "住所";
                break;
              default:
                break;
            }

            return (
              <FormGroup key={key}>
                <Label>{label}</Label>
                <Input
                  type="text"
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                />
              </FormGroup>
            );
          })}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "計算中..." : "計算する"}
          </Button>
          <Button
            type="button"
            onClick={handleDemoData}
            style={{ marginTop: "10px", backgroundColor: "#28a745" }}
          >
            デモデータを自動入力
          </Button>
        </form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormContainer>

      {result && <ResultsPage result={result} />}
      <a
        href="https://github.com/k213009/real-estate-simulation"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHubリポジトリ
      </a>
    </div>
  );
};

export default InputForm;
