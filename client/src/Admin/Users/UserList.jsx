import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  toggleUserStatus,
  toggleUserBlock,
  toggleUserSuspend,
  updateUser, // Add this to your UserSlice
} from "../redux/UserSlice";
import { toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { BASE_URL } from "../../Config";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const limit = 10;
  const [dateFilter, setDateFilter] = useState("all");

  const dateFilters = [
    { value: "all", label: "All Data" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "This Month" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
  ];

  const dispatch = useDispatch();
  const { users = [], totalPages = 1 } = useSelector((state) => state.users);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      fetchUsers({
        page: currentPage,
        limit,
        search: debouncedSearch,
        dateFilter,
      })
    );
  }, [dispatch, currentPage, debouncedSearch, dateFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const deleteUserHandler = async (id) => {
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
        await dispatch(deleteUser(id)).unwrap();
        dispatch(
          fetchUsers({
            page: currentPage,
            limit,
            search: debouncedSearch,
            dateFilter,
          })
        );

        Swal.fire("Deleted!", "User has been deleted.", "success");
      } catch (error) {
        Swal.fire(
          "Error!",
          error.response?.data?.message || "Error deleting user",
          "error"
        );
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await dispatch(toggleUserStatus({ id, currentStatus })).unwrap();
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleBlock = async (id, currentStatus) => {
    try {
      await dispatch(toggleUserBlock({ id, currentStatus })).unwrap();
      toast.success("Block Status updated successfully");
    } catch (error) {
      toast.error("Failed to update block status");
    }
  };

  const toggleSuspend = async (id, currentStatus) => {
    try {
      await dispatch(toggleUserSuspend({ id, currentStatus })).unwrap();
      toast.success("Suspend Status updated successfully");
    } catch (error) {
      toast.error("Failed to update suspend status");
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
  };

  const handleEditClick = (user) => {
    setEditUserData({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || ""
    });
    setEditErrors({}); // Clear errors when opening modal
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUserData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editUserData.firstName || editUserData.firstName.trim() === "") {
      errors.firstName = "Name is required";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async () => {
    // Validate before submitting
    if (!validateEditForm()) {
      return;
    }

    try {
      const updatePayload = {
        id: editUserData.id,
        firstName: editUserData.firstName.trim(),
        lastName: editUserData.lastName,
      };

      await dispatch(updateUser(updatePayload)).unwrap();
      toast.success("User updated successfully");

      // Close modal
      const modalElement = document.getElementById("editUserModal");
      const modal = window.bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        // Fallback if bootstrap is not available globally
        const closeButton = modalElement?.querySelector('.btn-close');
        if (closeButton) closeButton.click();
      }

      setEditUserData(null);
      setEditErrors({});

      // Refresh user list
      dispatch(
        fetchUsers({
          page: currentPage,
          limit,
          search: debouncedSearch,
          dateFilter,
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
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
                <h4 className="mb-0 page-title">Users List</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1 new" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/" className="new">
                        <i className="ri-group-2-line me-1 new" /> Users
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      User Listings
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
                  </div>
                  <div className="table-responsive table-card border-top">
                    <div data-simplebar="" className="cus-scroll scmob">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            <th>Phone Number</th>
                            <th>Name</th>
                            {/* <th>Last Name</th> */}
                            <th>Blocked</th>
                            <th>Suspended</th>
                            <th>Status</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length > 0 ? (
                            users.map((user, index) => (
                              <tr key={user.id}>
                                <td>{(currentPage - 1) * limit + index + 1}</td>
                                <td>({user.countryCode || ""}) {user.phoneNumber || ""}</td>
                                <td>{user.firstName || ""}</td>
                                {/* <td>{user.lastName || ""}</td> */}
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`toggleBlock${user.id}`}
                                      checked={user.block === "1"}
                                      onChange={() =>
                                        toggleBlock(user.id, user.block)
                                      }
                                      style={{
                                        backgroundColor:
                                          user.block === "1"
                                            ? "#1e3308"
                                            : "lightgray",
                                        borderColor:
                                          user.block === "1"
                                            ? "#1e3308"
                                            : "lightgray",
                                      }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`toggleSuspend${user.id}`}
                                      checked={user.suspend === "1"}
                                      onChange={() =>
                                        toggleSuspend(user.id, user.suspend)
                                      }
                                      style={{
                                        backgroundColor:
                                          user.suspend === "1"
                                            ? "#1e3308"
                                            : "lightgray",
                                        borderColor:
                                          user.suspend === "1"
                                            ? "#1e3308"
                                            : "lightgray",
                                      }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`toggleStatus${user.id}`}
                                      checked={user.status === "1"}
                                      onChange={() =>
                                        toggleStatus(user.id, user.status)
                                      }
                                      style={{
                                        backgroundColor:
                                          user.status === "1"
                                            ? "#1e3308"
                                            : "lightgray",
                                        borderColor:
                                          user.status === "1"
                                            ? "#1e3308"
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
                                      onClick={() => handleViewDetails(user)}
                                    >
                                      <i className="ri-eye-fill font-size-16"></i>
                                    </button>
                                    {/* Edit Button */}
                                    <button
                                      type="button"
                                      className="btn btn-soft-warning px-2 btn-sm me-1"
                                      data-bs-toggle="modal"
                                      data-bs-target="#editUserModal"
                                      onClick={() => handleEditClick(user)}
                                      title="Edit User"
                                    >
                                      <i className="ri-edit-line font-size-16"></i>
                                    </button>
                                    <button
                                      onClick={() => deleteUserHandler(user.id)}
                                      className="btn btn-soft-danger px-2 btn-sm"
                                      style={{
                                        backgroundColor: "#ea5455",
                                        borderColor: "#ea5455",
                                        color: "#fff",
                                      }}
                                      title="Delete User"
                                    >
                                      <i className="ri-delete-bin-line font-size-16"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                style={{ textAlign: "center", padding: "20px" }}
                              >
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-center align-items-center mt-3 ">
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
      </div>

      {/* User Details Offcanvas */}
      <div
        className="offcanvas offcanvas-end rdetails"
        tabIndex="-1"
        id="view-details"
        aria-labelledby="offcanvasRightLabel"
      >
        <div className="offcanvas-header d-block">
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center">
              <h5
                className="offcanvas-title mb-0 me-3 fw-semibold"
                id="offcanvasRightLabel"
              >
                User Details
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="offcanvas-body">
          {selectedUser ? (
            <>
              <div>
                <div className="border-bottom mb-2 pb-1">
                  <p className="mb-0 text-lowdark">
                    {`${selectedUser.country || ""}${selectedUser.country && selectedUser.city ? ", " : ""
                      }${selectedUser.city || ""}${(selectedUser.city || selectedUser.country) &&
                        selectedUser.state
                        ? ", "
                        : ""
                      }${selectedUser.state || ""}`}
                  </p>

                  <div className="mb-2">
                    <span className="text-primary fw-semibold font-size-18">
                      {selectedUser.status === "1" ? "Active" : "Inactive"}
                    </span>
                    <span
                      className="text-muted mx-2 border border-right"
                      style={{
                        borderColor: "#B9CAE2 !important",
                        marginRight: "12px !important",
                      }}
                    ></span>
                    <span className="text-muted">Member Since:</span>
                    <span className="text-primary fw-semibold font-size-18 ms-1">
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).getFullYear()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="font-size-16 fw-medium pt-3 mt-1 mb-2">
                User Information
              </div>
              <table
                className="table table-borderless"
                style={{ marginLeft: "-8px" }}
              >
                <tbody>
                  <tr>
                    <td>User ID :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.id}
                    </td>
                  </tr>
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
                    <td> Name :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.firstName || ""}
                    </td>
                  </tr>
                  {/* <tr>
                    <td>Last Name :</td>
                    <td className="text-end text-black fw-medium">
                      {selectedUser.lastName || ""}
                    </td>
                  </tr> */}
                  <tr>
                    <td>Blocked Status :</td>
                    <td className="text-end text-black fw-medium">
                      <span
                        className={`badge ${selectedUser.block === "1"
                          ? "bg-danger"
                          : "bg-success"
                          }`}
                      >
                        {selectedUser.block === "1" ? "Blocked" : "Not Blocked"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Suspended Status :</td>
                    <td className="text-end text-black fw-medium">
                      <span
                        className={`badge ${selectedUser.suspend === "1"
                          ? "bg-danger"
                          : "bg-success"
                          }`}
                      >
                        {selectedUser.suspend === "1"
                          ? "Suspended"
                          : "Not Suspended"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Account Status :</td>
                    <td className="text-end text-black fw-medium">
                      <span
                        className={`badge ${selectedUser.status === "1"
                          ? "bg-success"
                          : "bg-danger"
                          }`}
                      >
                        {selectedUser.status === "1" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="ri-user-line font-size-48 text-muted"></i>
              <p className="mt-3 text-muted">No user selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal - Only First Name & Last Name */}
      <div
        className="modal fade"
        id="editUserModal"
        tabIndex="-1"
        aria-labelledby="editUserModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#1e3308", color: "white" }}>
              <h5 className="modal-title" id="editUserModalLabel">
                <i className="ri-edit-line me-2"></i> Edit User
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {editUserData && (
                <form>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className={`form-control ${editErrors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={editUserData.firstName || ""}
                      onChange={handleEditChange}
                      placeholder="Enter Name"
                    />
                    {editErrors.firstName && (
                      <div className="invalid-feedback" style={{ display: 'block' }}>
                        {editErrors.firstName}
                      </div>
                    )}
                  </div>
                  {/* <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={editUserData.lastName || ""}
                      onChange={handleEditChange}
                      placeholder="Enter last name"
                    />
                  </div> */}
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: "#1e3308", borderColor: "#1e3308" }}
                onClick={handleUpdateUser}
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserList;