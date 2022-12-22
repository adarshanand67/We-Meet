import React from "react";

function FeaturesRev(props) {
  const { heading, description } = props;

  return (
    <div>
      <>
        {/* Product feature */}
        <div className="container p-5" data-aos="fade-right">
          <div className="row">
            <div className=" col d-flex flex-column">
              <div className="p-2">
                <h1 className="display-4 text-center fw-bold">{heading}</h1>
              </div>
              <div className="p-2">
                <p className="text-muted h5">{description}</p>
              </div>
            </div>
            <div className="col d-flex">
              <img
                src={require("../assets/images/wireframe.png")}
                alt="meeting"
                className="img-fluid"
              />
            </div>
          </div>
        </div>
      </>
    </div>
  );
}

export default FeaturesRev;
