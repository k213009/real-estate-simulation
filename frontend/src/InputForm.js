import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

// (styled-componentsの定義は変更なし)
const FormContainer = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
`;
const Section = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;
const InputGroup = styled.div`
  margin-bottom: 24px;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
`;
const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${(props) => (props.hasError ? "#d32f2f" : "#ddd")};
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? "#d32f2f" : "#007bff")};
    box-shadow: 0 0 0 2px
      ${(props) =>
        props.hasError ? "rgba(211, 47, 47, 0.2)" : "rgba(0, 123, 255, 0.2)"};
  }
`;
const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid ${(props) => (props.hasError ? "#d32f2f" : "#ddd")};
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
  background-color: white;
  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? "#d32f2f" : "#007bff")};
    box-shadow: 0 0 0 2px
      ${(props) =>
        props.hasError ? "rgba(211, 47, 47, 0.2)" : "rgba(0, 123, 255, 0.2)"};
  }
`;
const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;
const DemoButton = styled(Button)`
  background-color: #28a745;
  &:hover {
    background-color: #218838;
  }
  margin-top: 15px;
`;
const SectionTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  color: #007bff;
`;
const ErrorMessage = styled.span`
  color: #d32f2f;
  font-size: 14px;
  display: block;
  margin-top: 5px;
`;
const AppDescription = styled(Section)`
  background-color: #e7f3ff;
  border-left: 5px solid #007bff;
  p {
    margin-bottom: 10px;
    line-height: 1.6;
  }
`;
const Footer = styled.footer`
  margin-top: 40px;
  text-align: left;
  font-size: 14px;
  color: #666;
  p {
    margin-bottom: 10px;
  }
  a {
    color: #007bff;
  }
`;

function InputForm() {
  // --- ▼▼▼ ここを修正: defaultValuesを削除 ---
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoData = () => {
    reset({
      address: "沖縄市泡瀬4丁目",
      rent: 2304,
      rooms: 24,
      buildingCost: 25650,
      landCost: 8000,
      loanAmount: 30000,
      loanTerm: 35,
      interestRate: 2.3,
      structure: "RC",
      buildingAge: 0,
      buildingArea: 1080,
      landArea: 600,
      hasElevator: "yes",
      region: "Chunanbu",
    });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.error || `HTTP error! status: ${response.status}`
        );
      }
      const result = await response.json();
      navigate("/results", { state: { result: result } });
    } catch (error) {
      console.error("サーバーとの通信でエラーが発生しました:", error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <h1>うちなー収益物件シミュレーター</h1>

      <AppDescription>
        <p>
          <strong>沖縄の不動産投資、この一手で差をつける。</strong>
        </p>
        <p>
          本シミュレーターは、沖縄の市場に特化した投資分析ツールです。物件情報を入力するだけで、銀行評価額や長期的な収支を瞬時に可視化し、専門家でなくても精度の高い投資判断をサポートします。
        </p>
        <p>
          <strong>開発経緯：</strong>
          元銀行員の開発者が、お客様から頂いた「気になる物件があるけど、本当に投資して大丈夫？」「いくらまでなら銀行は貸してくれる？」というリアルな声に応えるために制作しました。誰でも無料でご利用いただけます。
        </p>
      </AppDescription>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* (フォームの各セクションは変更なし) */}
        <Section>
          <SectionTitle>物件情報</SectionTitle>
          <InputGroup>
            <Label htmlFor="address">場所（例：那覇市おもろまち4丁目）</Label>
            <p
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "-10px",
                marginBottom: "10px",
              }}
            >
              ※土地の「評価額」算出に利用します
            </p>
            <Input
              id="address"
              hasError={!!errors.address}
              {...register("address", { required: "場所は必須です" })}
            />
            {errors.address && (
              <ErrorMessage>{errors.address.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="rent">年間家賃収入（万円）</Label>
            <Input
              id="rent"
              type="number"
              step="0.01"
              hasError={!!errors.rent}
              {...register("rent", {
                required: "年間家賃収入は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.rent && <ErrorMessage>{errors.rent.message}</ErrorMessage>}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="rooms">部屋数</Label>
            <Input
              id="rooms"
              type="number"
              hasError={!!errors.rooms}
              {...register("rooms", {
                required: "部屋数は必須です",
                valueAsNumber: true,
                min: { value: 1, message: "1以上の値を入力してください" },
              })}
            />
            {errors.rooms && (
              <ErrorMessage>{errors.rooms.message}</ErrorMessage>
            )}
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>費用・価格情報</SectionTitle>
          <InputGroup>
            <Label htmlFor="buildingCost">建築費/購入額（万円）</Label>
            <Input
              id="buildingCost"
              type="number"
              step="0.01"
              hasError={!!errors.buildingCost}
              {...register("buildingCost", {
                required: "建築費/購入額は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.buildingCost && (
              <ErrorMessage>{errors.buildingCost.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="landCost">土地代（万円）</Label>
            <Input
              id="landCost"
              type="number"
              step="0.01"
              hasError={!!errors.landCost}
              {...register("landCost", {
                required: "土地代は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.landCost && (
              <ErrorMessage>{errors.landCost.message}</ErrorMessage>
            )}
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>借入情報</SectionTitle>
          <InputGroup>
            <Label htmlFor="loanAmount">借入金額（万円）</Label>
            <Input
              id="loanAmount"
              type="number"
              step="0.01"
              hasError={!!errors.loanAmount}
              {...register("loanAmount", {
                required: "借入金額は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.loanAmount && (
              <ErrorMessage>{errors.loanAmount.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="loanTerm">借入期間（年）</Label>
            <Input
              id="loanTerm"
              type="number"
              hasError={!!errors.loanTerm}
              {...register("loanTerm", {
                required: "借入期間は必須です",
                valueAsNumber: true,
                max: { value: 35, message: "35年以内で入力してください" },
                min: { value: 1, message: "1年以上の値を入力してください" },
              })}
            />
            {errors.loanTerm && (
              <ErrorMessage>{errors.loanTerm.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="interestRate">金利（%）</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.001"
              hasError={!!errors.interestRate}
              {...register("interestRate", {
                required: "金利は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0%以上の値を入力してください" },
              })}
            />
            {errors.interestRate && (
              <ErrorMessage>{errors.interestRate.message}</ErrorMessage>
            )}
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>物件詳細</SectionTitle>
          <InputGroup>
            <Label htmlFor="structure">構造</Label>
            <Select
              id="structure"
              hasError={!!errors.structure}
              {...register("structure", { required: "構造を選択してください" })}
            >
              <option value="">選択してください</option>
              <option value="RC">鉄筋コンクリート</option>
              <option value="Wood">木造</option>
              <option value="RC_Block">鉄筋コンクリートブロック</option>
              <option value="Steel">鉄骨</option>
            </Select>
            {errors.structure && (
              <ErrorMessage>{errors.structure.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="region">地域</Label>
            <Select
              id="region"
              hasError={!!errors.region}
              {...register("region", { required: "地域を選択してください" })}
            >
              <option value="">選択してください</option>
              <option value="Naha">那覇</option>
              <option value="Chunanbu">中南部</option>
              <option value="Hokubu">北部</option>
            </Select>
            {errors.region && (
              <ErrorMessage>{errors.region.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="buildingAge">築年数（新築は0）</Label>
            <Input
              id="buildingAge"
              type="number"
              hasError={!!errors.buildingAge}
              {...register("buildingAge", {
                required: "築年数は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.buildingAge && (
              <ErrorMessage>{errors.buildingAge.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="buildingArea">建物面積（㎡）</Label>
            <Input
              id="buildingArea"
              type="number"
              step="0.01"
              hasError={!!errors.buildingArea}
              {...register("buildingArea", {
                required: "建物面積は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.buildingArea && (
              <ErrorMessage>{errors.buildingArea.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="landArea">土地面積（㎡）</Label>
            <p
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "-10px",
                marginBottom: "10px",
              }}
            >
              ※土地の「評価額」算出に利用します
            </p>
            <Input
              id="landArea"
              type="number"
              step="0.01"
              hasError={!!errors.landArea}
              {...register("landArea", {
                required: "土地面積は必須です",
                valueAsNumber: true,
                min: { value: 0, message: "0以上の値を入力してください" },
              })}
            />
            {errors.landArea && (
              <ErrorMessage>{errors.landArea.message}</ErrorMessage>
            )}
          </InputGroup>
          <InputGroup>
            <Label>エレベーターの有無</Label>
            <div>
              <input
                type="radio"
                id="elevatorYes"
                value="yes"
                {...register("hasElevator", { required: "選択は必須です" })}
              />
              <label htmlFor="elevatorYes" style={{ marginRight: "20px" }}>
                あり
              </label>
              <input
                type="radio"
                id="elevatorNo"
                value="no"
                {...register("hasElevator", { required: "選択は必須です" })}
              />
              <label htmlFor="elevatorNo">なし</label>
            </div>
            {errors.hasElevator && (
              <ErrorMessage>{errors.hasElevator.message}</ErrorMessage>
            )}
          </InputGroup>
        </Section>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "計算中..." : "シミュレーション実行"}
        </Button>
        <DemoButton type="button" onClick={handleDemoData}>
          デモ用データを自動入力
        </DemoButton>
      </form>

      <Footer>
        <p>
          免責事項：本シミュレーションはあくまで概算値であり、実際の投資結果を保証するものではありません。投資の最終判断はご自身の責任において行ってください。
        </p>
        <p style={{ textAlign: "center" }}>
          <a
            href="https://github.com/k213009/uchina-real-estate-sim"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHubリポジトリ
          </a>
        </p>
      </Footer>
    </FormContainer>
  );
}

export default InputForm;
