import React from "react";
import { Routes, Route } from "react-router-dom";
// InputFormを正しい場所からインポートするように修正
import InputForm from "./InputForm";
import ResultsPage from "./ResultsPage";

function App() {
  return (
    <div>
      <Routes>
        {/* メインページ ("/") ではInputFormを表示 */}
        <Route path="/" element={<InputForm />} />

        {/* 結果ページ ("/results") ではResultsPageを表示 */}
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </div>
  );
}

export default App;
