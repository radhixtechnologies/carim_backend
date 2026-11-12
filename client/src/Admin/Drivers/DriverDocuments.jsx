import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance } from "../../Config";
import DocumentPreviewCard from "./DocumentPreviewCard";
import { getUploadedDocSummary, resolveMediaUrl } from "../../utils/mediaUrl";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

const DriverDocuments = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredDriverId, setFilteredDriverId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;



  const { driverId } = useParams();
  const navigate = useNavigate();

  const dateFilters = [
    { value: "all", label: "All Data" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "This Month" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
  ];
  useEffect(() => {
    if (driverId) {
      setFilteredDriverId(driverId);
      fetchDriverData(driverId, 1);
    } else {
      fetchAllData(1);
    }
  }, [driverId, dateFilter]);

  const fetchDriverData = async (id, pageNum = currentPage) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/document?driverId=${id}&dateFilter=${dateFilter}&page=${pageNum}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`
      );

      if (response.data.success && response.data.body.data.length > 0) {
        const driverData = response.data.body.data;
        setUsers(driverData);
        setTotalPages(response.data.body.totalPages || 1);
        setCurrentPage(response.data.body.currentPage || 1);

        if (driverData.length > 0 && driverData[0].name) {
          setDriverName(driverData[0].name);
        }
      } else {
        Swal.fire(
          "Not Found",
          `No documents found for Driver ID: ${id}`,
          "warning"
        ).then(() => {
          navigate("/documentlist");
        });
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "An error occurred while fetching driver documents",
        "error"
      ).then(() => {
        navigate("/documentlist");
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (pageNum = currentPage) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/document?dateFilter=${dateFilter}&page=${pageNum}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)
        }`
      );

      if (response.data.success) {
        setUsers(response.data.body.data || []);
        setTotalPages(response.data.body.totalPages || 1);
        setCurrentPage(response.data.body.currentPage || 1);
        setDriverName("");
      } else {
        toast.error(response.data.message || "Failed to load document list");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllDocuments = () => {
    setFilteredDriverId(null);
    setDriverName("");
    setDateFilter("all");
    navigate("/documentlist");
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (filteredDriverId) {
      fetchDriverData(filteredDriverId, 1);
    } else {
      fetchAllData(1);
    }
  };
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    if (filteredDriverId) {
      fetchDriverData(filteredDriverId, value);
    } else {
      fetchAllData(value);
    }
  };
  const handleDateFilter = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowOffcanvas(true);

    const offcanvasElement = document.getElementById("view-details");
    if (offcanvasElement) {
      const offcanvas = new window.bootstrap.Offcanvas(offcanvasElement);
      offcanvas.show();
    }
  };

  const handleCloseOffcanvas = () => {
    setShowOffcanvas(false);
    setSelectedUser(null);
  };

  const getApprovalLabel = (documentVerify) => {
    switch (documentVerify) {
      case "0":
        return "Pending";
      case "1":
        return "Verified";
      case "2":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const getApprovalClass = (documentVerify) => {
    switch (documentVerify) {
      case "0":
        return "bg-warning text-dark";
      case "1":
        return "bg-success text-white";
      case "2":
        return "bg-danger text-white";
      default:
        return "bg-warning text-dark";
    }
  };

  const getApprovalBadge = (documentVerify) => {
    switch (documentVerify) {
      case "0":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "1":
        return <span className="badge bg-success">Verified</span>;
      case "2":
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  const changeStatus = async (userId, newStatus) => {
    try {
      const response = await axiosInstance.post(`/documentVerified`, {
        id: userId,
        documentVerify: newStatus,
      });

      if (response.data.success) {
        if (filteredDriverId) {
          fetchDriverData(filteredDriverId);
        } else {
          fetchAllData();
        }

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser((prev) => ({
            ...prev,
            documentVerify: newStatus,
          }));
        }

        toast.success("Document status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating document status");
    }
  };

  const getPageTitle = () => {
    return filteredDriverId
      ? `Driver Documents - ${driverName || `ID: ${filteredDriverId}`}`
      : "Driver Documents List";
  };

  const getBreadcrumbText = () => {
    return filteredDriverId
      ? `${driverName || `Driver ${filteredDriverId}`} Documents`
      : "Driver Documents Listings";
  };


  const getCurrentFilterLabel = () => {
    const filter = dateFilters.find((f) => f.value === dateFilter);
    return filter ? filter.label : "All Data";
  };



  return (
    <>
      <ToastContainer />
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">{getPageTitle()}</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/documentlist" className="new">
                        <i className="ri-file-text-line me-1" /> Documents
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {getBreadcrumbText()}
                    </li>
                  </ol>
                </nav>
              </div>

              {filteredDriverId && (
                <div className="alert alert-info mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="ri-information-line me-2"></i>
                      Showing documents for:{" "}
                      <strong>
                        {driverName || `Driver ID: ${filteredDriverId}`}
                      </strong>
                    </div>
                    <button
                      onClick={handleShowAllDocuments}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="ri-list-unordered me-1"></i>
                      Show All Documents
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading documents...</p>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body cusbar">
                    <div
                      className="card-head justify-content-start adjusttwo mb-3"
                      style={{ flexWrap: "nowrap" }}
                    >

                      <div className="tbl-search position-relative me-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch();
                            }
                          }}
                        />
                        <i className="ri-search-line" />
                      </div>


                      {/* Date Filter Dropdown */}
                      <div className="dropdown tbl-drop">
                        <button
                          className="btn btn-light dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="ri-calendar-2-line me-2"></i>
                          {getCurrentFilterLabel()}
                        </button>
                        <ul className="dropdown-menu">
                          {dateFilters.map((filter) => (
                            <li key={filter.value}>
                              <button
                                className={`dropdown-item ${dateFilter === filter.value ? "active" : ""
                                  }`}
                                type="button"
                                onClick={() => handleDateFilter(filter.value)}
                              >
                                {filter.label}
                                {dateFilter === filter.value && (
                                  <i className="ri-check-line ms-2 text-success"></i>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="table-responsive table-card border-top overflow-visible">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            {/* <th>Image</th> */}
                            <th>first Name</th>
                            <th>Last Name</th>
                             <th>Vehicle Type</th>
                             <th>Vehicle Number</th> 
                            <th>Location</th>
                            <th>Documents</th>
                            <th>Verified Status</th>
                            <th>Upload Date</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length > 0 ? (
                            users.map((user, index) => (
                              <tr key={user.id}>
                                <td>{index + 1}</td>
                                {/* <td>
                                  {user.image ? (
                                    <img
                                      src={`${BASE_URL}/${user.image}`}
                                      alt="User"
                                      style={{
                                        width: "50px",
                                        height: "50px",
                                        borderRadius: "50%",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                                      style={{ width: "50px", height: "50px" }}
                                    >
                                      <i className="ri-user-line text-muted"></i>
                                    </div>
                                  )}
                                </td> */}
                                <td>{user.firstName || ""}</td>
                                <td>{user.lastName || ""}</td>

                                 <td>
                                  <span className="badge bg-primary-subtle text-primary">
                                    {user.vehicleDetail?.vehicleType || "Not Set"}
                                  </span>
                                 </td>
                                 <td>{user.vehicleDetail?.vehicleNumber || ""}</td> 
                                <td>
                                  {user.location || [user.city, user.country].filter(Boolean).join(", ") || ""}
                                </td>
                                <td>
                                  {(() => {
                                    const summary = getUploadedDocSummary(user.vehicleDetail);
                                    const badgeClass =
                                      summary.uploaded === summary.total
                                        ? "bg-success-subtle text-success"
                                        : summary.uploaded > 0
                                        ? "bg-warning-subtle text-warning"
                                        : "bg-secondary-subtle text-secondary";
                                    return (
                                      <span className={`badge ${badgeClass}`}>
                                        {summary.uploaded}/{summary.total} Docs
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td>
                                  <div className="dropdown dropup">
                                    <button
                                      className={`btn btn-sm dropdown-toggle ${getApprovalClass(
                                        user.documentVerify
                                      )}`}
                                      type="button"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                      style={{ minWidth: "100px" }}
                                    >
                                      {getApprovalLabel(user.documentVerify)}
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          disabled
                                        >
                                          <i
                                            className={`${user.documentVerify === "0"
                                              ? "ri-time-line text-warning"
                                              : user.documentVerify === "1"
                                                ? "ri-check-line text-success"
                                                : "ri-close-line text-danger"
                                              } me-2`}
                                          ></i>
                                          {getApprovalLabel(
                                            user.documentVerify
                                          )}
                                          <i className="ri-check-line ms-2"></i>
                                        </button>
                                      </li>

                                      {user.documentVerify !== "1" && (
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            onClick={() =>
                                              changeStatus(user.id, "1")
                                            }
                                          >
                                            <i className="ri-check-line me-2 text-success"></i>
                                            Verify
                                          </button>
                                        </li>
                                      )}

                                      {user.documentVerify !== "2" && (
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            onClick={() =>
                                              changeStatus(user.id, "2")
                                            }
                                          >
                                            <i className="ri-close-line me-2 text-danger"></i>
                                            Reject
                                          </button>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                </td>
                                <td>
                                  {user.createdAt
                                    ? new Date(
                                      user.createdAt
                                    ).toLocaleDateString()
                                    : ""}
                                </td>
                                <td>
                                  <div className="d-flex justify-content-end">
                                    <button
                                      type="button"
                                      className="btn btn-soft-primary px-2 btn-sm me-1"
                                      onClick={() => handleViewDetails(user)}
                                      title="View Details"
                                    >
                                      <i className="ri-eye-fill font-size-16"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="10"
                                style={{ textAlign: "center", padding: "20px" }}
                              >
                                {filteredDriverId
                                  ? `No documents found for ${driverName ||
                                  `Driver ID: ${filteredDriverId}`
                                  }`
                                  : "No drivers found"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-center align-items-center mt-3">
                        <Stack
                          spacing={2}
                          className="d-flex justify-content-center mt-3"
                        >
                          <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                          />
                        </Stack>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas details view */}
      <div
        className="offcanvas offcanvas-end rdetails"
        tabIndex="-1"
        id="view-details"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header d-block">
          <div className="d-flex align-items-center justify-content-between">
            <h5
              className="offcanvas-title mb-0 me-3 fw-semibold"
              id="offcanvasRightLabel"
            >
              {filteredDriverId
                ? `${driverName || `Driver ${filteredDriverId}`} Documents`
                : "Driver Documents"}
            </h5>
            {selectedUser && (
              <div className="d-flex align-items-center">
                <span className="me-2">Status:</span>
                {getApprovalBadge(selectedUser.documentVerify)}
              </div>
            )}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
              onClick={handleCloseOffcanvas}
            ></button>
          </div>
        </div>
        <div className="offcanvas-body">
          {selectedUser ? (
            <>
              {resolveMediaUrl(selectedUser.image) ? (
                <div className="text-center mb-3">
                  <img
                    src={resolveMediaUrl(selectedUser.image)}
                    alt="Driver Avatar"
                    className="rounded-circle border"
                    style={{
                      width: "84px",
                      height: "84px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const imgSrc = resolveMediaUrl(selectedUser.image);
                      if (window.$ && window.$.fancybox) {
                        window.$.fancybox.open([{ src: imgSrc, type: "image" }]);
                      } else {
                        window.open(imgSrc, "_blank", "noopener,noreferrer");
                      }
                    }}
                  />
                </div>
              ) : null}

              {/* Vehicle Details Section */}
              <div className="card ">
                <div className="card-body">
                  <h5 className="card-title ">
                    <i className="ri-car-line me-2"></i>
                    Vehicle Details
                  </h5>

                  {selectedUser.vehicleDetail ? (
                    <div className="row">
                      <div className="col-12">
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td
                                className="fw-medium"
                                style={{ width: "40%" }}
                              >
                                Vehicle Type:
                              </td>
                              <td className="text-end">
                                <span className="badge bg-primary-subtle text-primary">
                                  {selectedUser.vehicleDetail.vehicleType ||
                                    "Not Set"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="fw-medium"
                                style={{ width: "40%" }}
                              >
                                Brand:
                              </td>
                              <td className="text-end">
                                {selectedUser.vehicleDetail.vehicleBrand ||
                                  "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Model:</td>
                              <td className="text-end">
                                {selectedUser.vehicleDetail.vehicleModel ||
                                  "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Year:</td>
                              <td className="text-end">
                                {selectedUser.vehicleDetail.vehicleYear ||
                                  "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Vehicle Number:</td>
                              <td className="text-end">
                                {selectedUser.vehicleDetail.vehicleNumber ||
                                  "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Color:</td>
                              <td className="text-end">
                                {selectedUser.vehicleDetail.vehicleColor ||
                                  "N/A"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <i className="ri-car-line font-size-48 text-muted"></i>
                      <p className="mt-2 text-muted">
                        No vehicle details available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="ri-file-text-line me-2"></i>
                    Vehicle Documents
                  </h5>

                  {selectedUser.vehicleDetail ? (
                    <div className="row">
                      <div className="col-12">
                        <DocumentPreviewCard
                          title="Vehicle Registration Document"
                          filePath={selectedUser.vehicleDetail.vehicleDocument}
                        />
                      </div>
                      <div className="col-12">
                        <DocumentPreviewCard
                          title="Vehicle Insurance Document"
                          filePath={selectedUser.vehicleDetail.insurance}
                        />
                      </div>
                      <div className="col-12">
                        <DocumentPreviewCard
                          title="Driving Licence"
                          filePath={selectedUser.vehicleDetail.drivingLicence}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <i className="ri-file-text-line font-size-48 text-muted"></i>
                      <p className="mt-2 text-muted">
                        No vehicle documents available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Verification Status */}
              <div className="card mb-4">
                <div className="card-body">
                  <h6 className="card-title mb-3">
                    Document Verification Status
                  </h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="dropdown">
                      <button
                        className={`btn btn-sm dropdown-toggle ${getApprovalClass(
                          selectedUser.documentVerify
                        )}`}
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ minWidth: "120px" }}
                      >
                        {getApprovalLabel(selectedUser.documentVerify)}
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button className="dropdown-item" disabled>
                            <i
                              className={`${selectedUser.documentVerify === "0"
                                ? "ri-time-line text-warning"
                                : selectedUser.documentVerify === "1"
                                  ? "ri-check-line text-success"
                                  : "ri-close-line text-danger"
                                } me-2`}
                            ></i>
                            {getApprovalLabel(selectedUser.documentVerify)}
                            <i className="ri-check-line ms-2"></i>
                          </button>
                        </li>

                        {selectedUser.documentVerify !== "1" && (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => changeStatus(selectedUser.id, "1")}
                            >
                              <i className="ri-check-line me-2 text-success"></i>
                              Verify
                            </button>
                          </li>
                        )}

                        {selectedUser.documentVerify !== "2" && (
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => changeStatus(selectedUser.id, "2")}
                            >
                              <i className="ri-close-line me-2 text-danger"></i>
                              Reject
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="text-muted small">
                      {selectedUser.vehicleDetail
                        ? "Vehicle documents available"
                        : "No vehicle documents"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-size-16 fw-medium mt-1 mb-3">
                Driver Information
              </div>
              <table
                className="table table-borderless"
                style={{ marginLeft: "-8px" }}
              >
                <tbody>
                  <tr>
                    <td>Driver ID:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.id}
                    </td>
                  </tr>
                  <tr>
                    <td>First Name:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.firstName || ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Last Name:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.lastName || ""}
                    </td>
                  </tr>
                  {/* <tr>
                    <td>Email:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.email || ""}
                    </td>
                  </tr> */}
                  <tr>
                    <td>Country Code :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.countryCode || ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Phone Number :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.phoneNumber || ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Location:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.location ||
                        [selectedUser.city, selectedUser.state, selectedUser.country]
                          .filter(Boolean)
                          .join(", ") ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Verification Status:</td>
                    <td className="text-end">
                      {getApprovalBadge(selectedUser.documentVerify)}
                    </td>
                  </tr>
                  <tr>
                    <td>Last Updated:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.updatedAt
                        ? new Date(selectedUser.updatedAt).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4">
                <div className="font-size-16 fw-medium mb-2">Bio:</div>
                <div className="bg-light p-3 rounded">
                  {selectedUser.bio ? (
                    <textarea
                      readOnly
                      className="form-control "
                      rows="4"
                      value={selectedUser.bio}
                      style={{
                        resize: "none",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid black",
                      }}
                    />
                  ) : (
                    <p className="text-muted mb-0">No bio available</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="ri-user-line font-size-48 text-muted"></i>
              <p className="mt-3 text-muted">No driver selected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DriverDocuments;
