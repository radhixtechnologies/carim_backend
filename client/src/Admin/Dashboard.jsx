import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance } from "../Config";
import "react-toastify/dist/ReactToastify.css";
import ApexCharts from "./ApexChart";
import {
  Users,
  UserCheck,
  ClipboardList,
  Star,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const Dashboard = () => {
  const [users, setUsers] = useState(0);
  const [lenderCount, setLenderCount] = useState(0);
  const [booking, setBooking] = useState(0);
  const [rating, setRating] = useState(0);
  const [contact, setContact] = useState(0);
  const [faq, setFaq] = useState(0);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard", {});

        if (response.data.success) {
          const body = response.data.body;
          setUsers(body.player || 0);
          setLenderCount(body.coach || 0);

          setBooking(body.booking || 0);
          setRating(body.rating || 0);
          setContact(body.contact || 0);
          setFaq(body.faq || 0);
        } else {
        }
      } catch (error) {
        toast.error("An error occurred while fetching the dashboard data");
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <>
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="title-box mb-3 pb-1">
              <h4 className="mb-0 page-title">Dashboard</h4>
              <nav aria-label="breadcrumb" className="mt-1">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard" className="new">
                      <i className="ri-home-4-fill me-1"></i> Home
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    <i className="ri-pie-chart-2-fill me-1"></i> Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="row">
              <div className="col-lg-12">
                <div className="card key-matrix">
                  <div className="card-body pb-0">
                    <div className="card-head mb-3">
                      <div>
                        <div className="card-title mb-0">Growth Dashboard</div>
                        <p className="card-sub-title text-muted mb-0">
                          Track your platform’s growth in real-time and get
                          insights at a glance.
                        </p>
                      </div>
                    </div>
                    <div className="row gx-3">
                      <div className="col">
                        <Link to="/userlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <Users className="text-primary" size={40} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {users}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Users
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/driverlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <UserCheck
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {lenderCount}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Drivers
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/ridelist ">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <ClipboardList
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {booking}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Rides
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      {/* <div className="col">
                        <Link to="/ratinglist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <Star className="text-primary" size={40} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {rating}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Ratings
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div> */}

                      <div className="col">
                        <Link to="/contactlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <MessageSquare
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {contact}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Contacts
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/faqlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <HelpCircle
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {faq}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total FAQ'S
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 mt-3">
                <div className="card">
                  <div className="card-body">
                    <ApexCharts width="100%" height="300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
