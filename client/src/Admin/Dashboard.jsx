import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance } from "../Config";
import "react-toastify/dist/ReactToastify.css";
import ApexCharts from "./ApexChart";
import TeamChart from "./TeamChart";
import {
  Users,
  UserCheck,
  BookOpen,
  Trophy,
  BarChart3,
  MapPin,
  Shield,
  Calendar,
  ClipboardList,
  Star,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const Dashboard = () => {
  const [users, setUsers] = useState(0);
  const [lenderCount, setLenderCount] = useState(0);
  const [sport, setSport] = useState(0);
  const [tutorial, setTutorial] = useState(0);
  const [level, setLevel] = useState(0);
  const [position, setPosition] = useState(0);
  const [team, setTeam] = useState(0);
  const [match, setMatch] = useState(0);
  const [booking, setBooking] = useState(0);
  const [rating, setRating] = useState(0);
  const [contact, setContact] = useState(0);
  const [faq, setFaq] = useState(0);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication token missing");
          navigate("/login");
          return;
        }

        const response = await axiosInstance.get("/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const body = response.data.body;
          setUsers(body.player || 0);
          setLenderCount(body.coach || 0);
          setSport(body.sport || 0);
          setTutorial(body.tutorial || 0);
          setLevel(body.level || 0);
          setPosition(body.position || 0);
          setTeam(body.team || 0);
          setMatch(body.match || 0);
          setBooking(body.booking || 0);
          setRating(body.rating || 0);
          setContact(body.contact || 0);
          setFaq(body.faq || 0);
        } else {
          toast.error("Failed to fetch dashboard data");
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
                        <Link to="/playerlist">
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
                                    Total Players
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/coachlist">
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
                                    Total Coachs
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/tutoriallist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <BookOpen
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {tutorial}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Tutorials
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/sportlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <Trophy className="text-primary" size={40} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {sport}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Sports
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/levellist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <BarChart3
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {level}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Levels
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/positionlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <MapPin className="text-primary" size={40} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {position}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Positions
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/teamlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <Shield className="text-primary" size={40} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {team}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Teams
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/matchlist">
                          <div className="card bg-soft-blue">
                            <div
                              className="card-body"
                              style={{ paddingBottom: "13px" }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                  <Calendar
                                    className="text-primary"
                                    size={40}
                                  />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h5 className="mb-1 mt-2 fw-semibold">
                                    {match}
                                  </h5>
                                  <p className="text-muted mb-1 fw-medium font-size-15 one-ellips">
                                    Total Matchs
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
                        <Link to="/bookinglist">
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
                                    Total Bookings
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col">
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
                      </div>

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
              <div className="col-lg-6 mt-3">
                <div className="card">
                  <div className="card-body">
                    <TeamChart width="100%" height="300" />
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
