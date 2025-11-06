import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance, BASE_URL } from "../../Config";

const TutorialList = () => {
  const [tutorials, setTutorials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTutorial, setSelectedTutorial] = useState(null);
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
    try {
      const response = await axiosInstance.get(
        `/tutoriallist?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&dateFilter=${filter}`
      );

      if (response.data.success) {
        setTutorials(response.data.body.data);
        setTotalPages(response.data.body.totalPages);
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Failed to load tutorials list",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "An error occurred while fetching the tutorial list",
        "error"
      );
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleDateFilter = (filterValue) => {
    setDateFilter(filterValue);
    setCurrentPage(1);
  };

  const getCurrentFilterLabel = () => {
    const filter = dateFilters.find((f) => f.value === dateFilter);
    return filter ? filter.label : "All Data";
  };

  const deleteTutorial = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.post(`/tutorialdelete/${id}`);
        fetchData(currentPage, searchTerm, dateFilter);
        Swal.fire("Deleted!", "Tutorial has been deleted.", "success");
      } catch (error) {
        Swal.fire(
          "Error!",
          error.response?.data?.message || "Error deleting Tutorial",
          "error"
        );
      }
    } else {
      Swal.fire("Cancelled", "Tutorial deletion has been cancelled", "info");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "0" ? "1" : "0";

    try {
      const response = await axiosInstance.post(`/tutorialupdate`, {
        id,
        status: newStatus,
      });

      if (response.data.success) {
        fetchData(currentPage, searchTerm, dateFilter);
        toast.success("Status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to change status");
      }
    } catch (error) {
      toast.error("An error occurred while changing tutorial status");
    }
  };

  const handleViewDetails = (tutorial) => {
    setSelectedTutorial(tutorial);
  };

  return (
    <>
      <ToastContainer />
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Tutorial List</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/" className="new">
                        <i className="ri-group-2-line me-1" /> Tutorials
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Tutorial Listings
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
                        placeholder="Search..."
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
                    {/* <div className="d-flex justify-content-end ms-auto">
                      <Link
                        to="/addtutorial"
                        className="btn btn-soft-primary px-2 btn-sm me-1"
                      >
                        <i className="ri-add-fill font-size-16"></i>
                      </Link>
                    </div> */}
                  </div>
                  <div className="table-responsive table-card border-top">
                    <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                      <thead>
                        <tr>
                          <th>Sr no.</th>
                          <th>Coach Name</th>
                          <th>Title</th>
                          <th>Price($)</th>
                          <th>Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tutorials.length > 0 ? (
                          tutorials.map((tutorial, index) => (
                            <tr key={tutorial.id}>
                              <td>{(currentPage - 1) * limit + index + 1}</td>
                              <td>{tutorial.tutorialcoach?.name || ""}</td>
                              <td>{tutorial.title || ""}</td>
                              <td>${tutorial.price}</td>
                              <td>
                                <div className="form-check form-switch ">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`toggleStatus${tutorial.id}`}
                                    checked={tutorial.status === "1"}
                                    onChange={() =>
                                      toggleStatus(tutorial.id, tutorial.status)
                                    }
                                    style={{
                                      backgroundColor:
                                        tutorial.status === "1"
                                          ? "#007bff"
                                          : "lightgray",
                                      borderColor:
                                        tutorial.status === "1"
                                          ? "#007bff"
                                          : "lightgray",
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                <div className="d-flex justify-content-end">
                                  <button
                                    type="button"
                                    className="btn btn-soft-primary px-2 btn-sm me-1"
                                    data-bs-toggle="offcanvas"
                                    data-bs-target="#view-details"
                                    aria-controls="offcanvasRight"
                                    onClick={() => handleViewDetails(tutorial)}
                                  >
                                    <i className="ri-eye-fill font-size-16"></i>
                                  </button>
                                  {/* <Link
                                    to={`/updatetutorial/${tutorial.id}`}
                                    className="btn btn-soft-primary px-2 btn-sm me-1"
                                    title="View tutorial Details"
                                  >
                                    <i className="ri-edit-fill font-size-16"></i>{" "}
                                  </Link> */}
                                  <button
                                    onClick={() => deleteTutorial(tutorial.id)}
                                    className="btn btn-soft-danger px-2 btn-sm"
                                    title="Delete Tutorial"
                                  >
                                    <i className="ri-delete-bin-line font-size-16"></i>{" "}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              style={{ textAlign: "center", padding: "20px" }}
                            >
                              No tutorial found
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
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Details Offcanvas */}
      <div
        className="offcanvas offcanvas-end rdetails"
        tabIndex="-1"
        id="view-details"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header d-block">
          <div className="d-flex align-items-center">
            <h5
              className="offcanvas-title mb-0 me-3 fw-semibold"
              id="offcanvasRightLabel"
            >
              Tutorial Details
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
          {selectedTutorial ? (
            <>
              <div className="font-size-16 fw-medium pt-3 mt-1 mb-2">Media</div>

              {selectedTutorial.tutorialImages &&
              selectedTutorial.tutorialImages.length > 0 ? (
                <div className="row">
                  {selectedTutorial.tutorialImages.map((media, index) => (
                    <div key={index} className="col-6 mb-3">
                      {/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(
                        media.image
                      ) ? (
                        <img
                          src={`${BASE_URL}/${media.image}`}
                          alt={`tutorial-media-${index}`}
                          className="img-fluid rounded"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (window.$.fancybox) {
                              window.$.fancybox.open([
                                {
                                  src: `${BASE_URL}/${media.image}`,
                                  type: "image",
                                },
                              ]);
                            }
                          }}
                        />
                      ) : /\.(mp4|mov|avi|mkv)$/i.test(media.image) ? (
                        <video
                          controls
                          className="img-fluid rounded"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                        >
                          <source
                            src={`${BASE_URL}/${media.image}`}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center bg-light rounded"
                          style={{
                            width: "100%",
                            height: "150px",
                          }}
                        >
                          <p className="text-muted mb-0">Unsupported format</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No media available for this tutorial.</p>
              )}

              <div className="font-size-16 fw-medium pt-3 mt-1 mb-2">
                Tutorial Information
              </div>
              <table className="table table-borderless">
                <tbody>
                  <tr className="d-flex justify-content-between">
                    <td className="flex-shrink-0">Tutorial ID :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedTutorial.id}
                    </td>
                  </tr>
                  <tr className="d-flex justify-content-between">
                    <td className="flex-shrink-0">Coach Name:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedTutorial?.tutorialcoach?.name || ""}
                    </td>
                  </tr>
                  <tr className="d-flex justify-content-between">
                    <td className="flex-shrink-0">Tutorial Title :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedTutorial.title || ""}
                    </td>
                  </tr>
                  <tr className="d-flex justify-content-between">
                    <td className="flex-shrink-0">Status :</td>
                    <td className="text-end text-black fw-medium">
                      <span
                        className={`badge ${
                          selectedTutorial.status === "1"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {selectedTutorial.status === "1"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-3">
                <div className="font-size-16 fw-medium mb-2">Description:</div>
                <div
                  className="bg-light"
                  
                >
                  {selectedTutorial.description ? (
                    <textarea
                      readOnly
                      className="form-control"
                      rows="4"
                      value={selectedTutorial.description}
                      style={{
                        resize: "none",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid black",
                      }}
                    />
                  ) : (
                    "No description available"
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="ri-user-line font-size-48 text-muted"></i>
              <p className="mt-3 text-muted">No tutorial selected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TutorialList;
