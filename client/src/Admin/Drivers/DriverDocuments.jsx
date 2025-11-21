import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance, BASE_URL } from "../../Config";

const DriverDocuments = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredDriverId, setFilteredDriverId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

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
      fetchDriverData(driverId);
    } else {
      fetchAllData();
    }
  }, [driverId, dateFilter]); 

  const fetchDriverData = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/document?driverId=${id}&dateFilter=${dateFilter}`);

      if (response.data.success && response.data.body.data.length > 0) {
        const driverData = response.data.body.data;
        setUsers(driverData);
        
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

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/document?dateFilter=${dateFilter}`);

      if (response.data.success) {
        setUsers(response.data.body.data || []);
        setDriverName(""); 
      } else {
        toast.error(response.data.message || "Failed to load document list");
      }
    } catch (error) {
      toast.error("An error occurred while fetching the document list");
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
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
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

  const displayUsers = filteredDriverId
    ? users
    : users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

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
                      <strong>{driverName || `Driver ID: ${filteredDriverId}`}</strong>
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
                      {!filteredDriverId && (
                        <div className="tbl-search position-relative me-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                          />
                          <i className="ri-search-line" />
                        </div>
                      )}
                      
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
                                className={`dropdown-item ${
                                  dateFilter === filter.value ? "active" : ""
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

                    <div className="table-responsive table-card border-top">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Location</th>
                            <th>Verified Status</th>
                            <th>Upload Date</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayUsers.length > 0 ? (
                            displayUsers.map((user, index) => (
                              <tr key={user.id}>
                                <td>{index + 1}</td>
                                <td>
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
                                </td>
                                <td>{user.name || "N/A"}</td>
                                <td>{user.email || "N/A"}</td>
                                <td>
                                  {`${user.city || ""}${
                                    user.city && user.country ? ", " : ""
                                  }${user.country || ""}` || "N/A"}
                                </td>
                                <td>
                                  <div className="dropdown">
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
                                      {["0", "1", "2"].map((status) => (
                                        <li key={status}>
                                          <button
                                            className={`dropdown-item ${
                                              status === user.documentVerify
                                                ? "active bg-light text-dark"
                                                : ""
                                            }`}
                                            type="button"
                                            onClick={() =>
                                              changeStatus(user.id, status)
                                            }
                                            disabled={
                                              status === user.documentVerify
                                            }
                                          >
                                            {status === "0" && (
                                              <i className="ri-time-line me-2 text-warning"></i>
                                            )}
                                            {status === "1" && (
                                              <i className="ri-check-line me-2 text-success"></i>
                                            )}
                                            {status === "2" && (
                                              <i className="ri-close-line me-2 text-danger"></i>
                                            )}
                                            {getApprovalLabel(status)}
                                            {status === user.documentVerify && (
                                              <i className="ri-check-line ms-2 text-success"></i>
                                            )}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </td>
                                <td>
                                  {user.createdAt ? (
                                    new Date(user.createdAt).toLocaleDateString()
                                  ) : (
                                    "N/A"
                                  )}
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
                                colSpan="8"
                                style={{ textAlign: "center", padding: "20px" }}
                              >
                                {filteredDriverId
                                  ? `No documents found for ${driverName || `Driver ID: ${filteredDriverId}`}`
                                  : "No drivers found"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
              {selectedUser.documents && selectedUser.documents.length > 0 ? (
                <div className="row">
                  {selectedUser.documents.map((document, index) => (
                    <div
                      key={document.id || index}
                      className="col-12 col-md-6 mb-3"
                    >
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="card-title mb-0">
                              Document {index + 1}
                            </h6>
                            <small className="text-muted">
                              {document.createdAt ? 
                                new Date(document.createdAt).toLocaleDateString() : 
                                "N/A"
                              }
                            </small>
                          </div>
                          {document.image ? (
                            <div className="text-center">
                              {/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(
                                document.image
                              ) ? (
                                <img
                                  src={`${BASE_URL}${document.image}`}
                                  alt={`Document ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{
                                    width: "100%",
                                    maxHeight: "300px",
                                    objectFit: "contain",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    if (window.$ && window.$.fancybox) {
                                      window.$.fancybox.open([
                                        {
                                          src: `${BASE_URL}${document.image}`,
                                          type: "image",
                                        },
                                      ]);
                                    } else {
                                      window.open(
                                        `${BASE_URL}${document.image}`,
                                        "_blank"
                                      );
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  className="d-flex flex-column align-items-center justify-content-center bg-light rounded"
                                  style={{
                                    width: "100%",
                                    height: "200px",
                                  }}
                                >
                                  <i className="ri-file-text-line font-size-48 text-muted mb-2"></i>
                                  <p className="text-muted mb-0 text-center">
                                    Unsupported image format
                                  </p>
                                  <a
                                    href={`${BASE_URL}${document.image}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary mt-2"
                                  >
                                    View File
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <i className="ri-file-damage-line font-size-48 text-muted"></i>
                              <p className="mt-2 text-muted">
                                No image available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="ri-file-text-line font-size-48 text-muted"></i>
                  <p className="mt-3 text-muted">No documents available</p>
                </div>
              )}

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
                        {["0", "1", "2"].map((status) => (
                          <li key={status}>
                            <button
                              className={`dropdown-item ${
                                status === selectedUser.documentVerify
                                  ? "active bg-light text-dark"
                                  : ""
                              }`}
                              type="button"
                              onClick={() =>
                                changeStatus(selectedUser.id, status)
                              }
                              disabled={status === selectedUser.documentVerify}
                            >
                              {status === "0" && (
                                <i className="ri-time-line me-2 text-warning"></i>
                              )}
                              {status === "1" && (
                                <i className="ri-check-line me-2 text-success"></i>
                              )}
                              {status === "2" && (
                                <i className="ri-close-line me-2 text-danger"></i>
                              )}
                              {getApprovalLabel(status)}
                              {status === selectedUser.documentVerify && (
                                <i className="ri-check-line ms-2 text-success"></i>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-muted small">
                      {selectedUser.documents &&
                      selectedUser.documents.length > 0
                        ? `${selectedUser.documents.length} document(s) uploaded`
                        : "No documents"}
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
                    <td>Name:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.name || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Email:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.email || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Location:</td>
                    <td className="text-end text-black fw-medium">
                      {`${selectedUser.country || ""}${
                        selectedUser.country && selectedUser.city ? ", " : ""
                      }${selectedUser.city || ""}${
                        (selectedUser.city || selectedUser.country) &&
                        selectedUser.state
                          ? ", "
                          : ""
                      }${selectedUser.state || ""}` || "N/A"}
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
                      {selectedUser.updatedAt ? 
                        new Date(selectedUser.updatedAt).toLocaleDateString() : 
                        "N/A"
                      }
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