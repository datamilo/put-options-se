import React from "react";

const PortfolioGenerator = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Portfolio Generator Works!</h1>
      <p>This is a minimal component that cannot crash.</p>
      <button onClick={() => window.location.href = "/"}>
        Back to Home
      </button>
    </div>
  );
};

export default PortfolioGenerator;