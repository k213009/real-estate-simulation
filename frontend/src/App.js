import React from "react";
import { Routes, Route } from "react-router-dom";
import InputForm from "./InputForm";
import ResultsPage from "./ResultsPage";

function App() {
  return (
    <div>
      <Routes>
        {/* メインページ ("/") では入力フォームを表示 */}
        <Route path="/" element={<InputForm />} />

        {/* 結果ページ ("/results") では結果表示画面を表示 */}
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </div>
  );
}

export default App;
