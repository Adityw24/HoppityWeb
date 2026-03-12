import React from "react";
import { useParams } from "react-router-dom";
import { trips } from "../data/Trips";

const Example = () => {

  const { slug } = useParams();
  const trip = trips().find((t) => t.slug === slug);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  return (
    <div className="bg-gray-500 h-screen w-full flex items-center justify-center">
      <h1>hola</h1>
    </div>
  );
};

export default Example;
