import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { axiosInstance } from "../Config";
import { toast, ToastContainer } from "react-toastify";

const TeamChart = () => {
  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState({
    chart: {
      height: 350,
      type: "pie",
    },
    labels: [],
    colors: ["#1E90FF", "#32CD32", "#FF6347", "#FFD700", "#FF69B4"],
    tooltip: {
      y: {
        formatter: (val) => `${val} teams`,
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.post(`/teamchart`);
        const { data, categories } = response.data;

        if (!Array.isArray(data) || !Array.isArray(categories)) {
          toast.error("Invalid data received.");
          return;
        }

        setSeries(data);
        setOptions((prevOptions) => ({
          ...prevOptions,
          labels: categories,
        }));
      } catch (error) {
        toast.error("Error fetching data: " + error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
      <div className="col-12">
        <div className="card card-statistics">
          <div className="card-header">
            <h4 className="card-title">Teams Chart</h4>
          </div>
          <div className="card-body">
            <ReactApexChart
              options={options}
              series={series}
              type="pie"
              height={350}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamChart;
