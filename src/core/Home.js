import React from "react";
import Banner from "../components/Banner";
import Navbar from "../components/Navbar";
import Content from "../components/Content";
import Carousel from "../components/Carousel";
import Features from "../components/Features";
import FeaturesRev from "../components/FeaturesRev";
import Product from "../components/Product";
import Footer from "../components/Footer";
import { features } from "../data/features";

const Home = () => (
  <div>
    <div className="App">
      <Navbar />
      {/* <Banner /> */}
      <Content />
      <Carousel />

      <Product />
      {features.map((feature, index) => {
        if (index % 2 === 0) {
          return (
            <Features
              key={index}
              heading={feature.heading}
              description={feature.description}
            />
          );
        } else {
          return (
            <FeaturesRev
              key={index}
              heading={feature.heading}
              description={feature.description}
            />
          );
        }
      })}
      <Footer />
    </div>
  </div>
);

export default Home;
