import React from "react";

function Product() {
  return (
    <div>
      <div className="container" data-aos="fade-up">
        <div className="row align-items-center justify-content-center">
          <div className="col" data-aos="fade-up">
            <p className="text-center display-4 fw-bold">Product features!</p>
          </div>
          <div className="col">
            <img
              src={require("../assets/images/amico.png")}
              alt="meeting"
              className="img-fluid"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;
