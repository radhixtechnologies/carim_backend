import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance } from "../../Config";

const ReportList = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const dateFilters = [
    { value: "all", label: "All Data" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "This Month" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
  ];

  useEffect(() => {
    fetchData(currentPage, searchTerm, dateFilter);
  }, [currentPage, searchTerm, dateFilter]);

  const fetchData = async (page, search = "", filter = "all") => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/reportlist?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&dateFilter=${filter}`
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        const responseData = response.data.body;
        setMatches(responseData.data || []);
        setTotalPages(responseData.totalPages || 1);
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Failed to load location",
          "error"
        );
        setMatches([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "An error occurred while fetching the location list",
        "error"
      );
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDateFilter = (filterValue) => {
    setDateFilter(filterValue);
    setCurrentPage(1);
  };

  const getCurrentFilterLabel = () => {
    const filter = dateFilters.find((f) => f.value === dateFilter);
    return filter ? filter.label : "All Data";
  };

  const deleteMatch = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1e3308",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.post(`/reportdelete/${id}`);
        await fetchData(currentPage, searchTerm, dateFilter);
        Swal.fire("Deleted!", "Location has been deleted.", "success");
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire(
          "Error!",
          error.response?.data?.message || "Error deleting location",
          "error"
        );
      }
    }
  };

  const handleViewDetails = (match) => {
    setSelectedMatch(match);
  };

  return (
    <>
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Location List</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/" className="new">
                        <i className="ri-group-2-line me-1" /> Location
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Location Listings
                    </li>
                  </ol>
                </nav>
              </div>

              <div className="card">
                <div className="card-body cusbar">
                  <div
                    className="card-head justify-content-start adjusttwo mb-3"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <div className="tbl-search position-relative">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by pickup or drop location..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      <i className="ri-search-line" />
                    </div>
                    <div className="dropdown tbl-drop mb-3">
                      <button
                        className="btn btn-light dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        {getCurrentFilterLabel()}
                      </button>
                      <ul className="dropdown-menu">
                        {dateFilters.map((filter) => (
                          <li key={filter.value}>
                            <button
                              className="dropdown-item"
                              type="button"
                              onClick={() => handleDateFilter(filter.value)}
                            >
                              {filter.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="d-flex justify-content-end ms-auto">
                      <Link
                        to="/ReportAdd"
                        className="btn btn-soft-primary px-2 btn-sm me-1"
                      >
                        <i className="ri-add-fill font-size-16"></i>
                      </Link>
                    </div>
                  </div>
                  <div className="table-responsive table-card border-top">
                    <div data-simplebar="" className="cus-scroll scmob">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            <th>Pickup Location</th>
                            <th>Drop Location</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : matches.length > 0 ? (
                            matches.map((match, index) => {
                              return (
                                <tr key={match.id}>
                                  <td>{(currentPage - 1) * limit + index + 1}</td>
                                  <td>{match.pickupLocation || "-"}</td>
                                  <td>{match.dropLocation || "-"}</td>
                                  <td>
                                    <div className="d-flex justify-content-end">
                                      <button
                                        type="button"
                                        className="btn btn-soft-primary px-2 btn-sm me-1"
                                        data-bs-toggle="offcanvas"
                                        data-bs-target="#view-details"
                                        aria-controls="offcanvasRight"
                                        onClick={() => handleViewDetails(match)}
                                      >
                                        <i className="ri-eye-fill font-size-16"></i>
                                      </button>

                                      <button
                                        onClick={() => deleteMatch(match.id)}
                                        className="btn btn-soft-danger px-2 btn-sm"
                                        style={{
                                          backgroundColor: "#ea5455",
                                          borderColor: "#ea5455",
                                          color: "#fff",
                                        }}
                                      >
                                        <i className="ri-delete-bin-line font-size-16"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                                <div>
                                  <i className="ri-inbox-line" style={{ fontSize: "48px", color: "#ccc" }}></i>
                                  <p className="mt-2">No locations found</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-3">
                          <Stack spacing={2}>
                            <Pagination
                              count={totalPages}
                              page={currentPage}
                              onChange={handlePageChange}
                              color="primary"
                              shape="rounded"
                            />
                          </Stack>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Offcanvas */}
      <div
        className="offcanvas offcanvas-end rdetails"
        tabIndex="-1"
        id="view-details"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header d-block">
          <div className="d-flex align-items-center justify-content-between">
            <h5
              className="offcanvas-title mb-0 fw-semibold"
              id="offcanvasRightLabel"
            >
              Location Details
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="offcanvas-body">
          {selectedMatch ? (
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <th style={{ width: "40%" }}>ID :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.id}</td>
                </tr>
                <tr>
                  <th>Pickup Location :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.pickupLocation || "-"}</td>
                </tr>
                <tr>
                  <th>Pickup Latitude :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.latitude || "-"}</td>
                </tr>
                <tr>
                  <th>Pickup Longitude :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.longitude || "-"}</td>
                </tr>
                <tr>
                  <th>Drop Location :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.dropLocation || "-"}</td>
                </tr>
                <tr>
                  <th>Drop Latitude :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.dropLatitude || "-"}</td>
                </tr>
                <tr>
                  <th>Drop Longitude :</th>
                  <td className="text-end text-black fw-medium">{selectedMatch.dropLongitude || "-"}</td>
                </tr>
                {/* <tr>
                  <th>Status :</th>
                  <td className="text-end">
                    <span className={`badge ${selectedMatch.status === 1 ? "bg-success" : "bg-warning"}`}>
                      {selectedMatch.status === 1 ? "Active" : "Pending"}
                    </span>
                  </td>
                </tr> */}
                <tr>
                  <th>Created At :</th>
                  <td className="text-end text-black fw-medium">
                    {selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="text-center py-5">
              <i className="ri-inbox-line" style={{ fontSize: "48px", color: "#ccc" }}></i>
              <p className="mt-3 text-muted">No location selected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportList;