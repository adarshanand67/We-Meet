import React from "react";
import Banner from "../components/Banner";
import Navbar from "../components/Navbar";
import Content from "../components/Content";
import Carousel from "../components/Carousel";
import Features from "../components/Features";
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
      {features.map((feature) => {
        return (
          <Features
            heading={feature.heading}
            description={feature.description}
          />
        );
      })}

      <Footer />
    </div>
  </div>
);

export default Home;
