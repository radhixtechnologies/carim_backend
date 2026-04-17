import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance } from "../../Config";
import { CSVLink } from "react-csv"; 
import * as XLSX from "xlsx"; 

const DriverWallet = () => {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedPayment, setSelectedPayments] = useState(null);
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
        `/driverWaletHistory?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&dateFilter=${filter}`
      );
      if (response.data.success) {
        setPayments(response.data.body.data);
        setTotalPages(response.data.body.totalPages);
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Failed to load Driver Wallet Recharge",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "An error occurred while fetching the Driver Wallet Recharge list",
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

  const handleViewDetails = (payment) => {
    setSelectedPayments(payment);
  };

   const deleteDriverWalllet = async (id) => {
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
          await axiosInstance.post(`/driverWalletDelete/${id}`);
  
          const response = await axiosInstance.get(
            `/driverWaletHistory?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(
              searchTerm
            )}&dateFilter=${dateFilter}`
          );
  
          if (response.data.success) {
            const newTotalPages = response.data.body.totalPages;
            const newData = response.data.body.data;
            if (newData.length === 0 && currentPage > 1) {
              setCurrentPage((prevPage) => prevPage - 1);
            } else {
              setPayments(newData);
              setTotalPages(newTotalPages);
            }
  
            Swal.fire("Deleted!", "Wallet Recharge has been deleted.", "success");
          }
        } catch (error) {
          Swal.fire(
            "Error!",
            error.response?.data?.message || "Error deleting contact",
            "error"
          );
        }
      } else {
      }
    };

  const prepareDataForExport = () => {
    return payments.map((payment) => ({
      "First Name": payment.user?.firstName || "",
      "Last Name": payment.user?.lastName || "",
      "Mobile Number": `${payment.user?.countryCode || ""} ${payment.user?.phoneNumber || ""}`,
      "Amount": payment.amount || "",
      "Transaction Date": new Date(payment.createdAt).toLocaleDateString(),
    }));
  };

  const handleExcelExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(prepareDataForExport());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DriverWalletRecharges");
    XLSX.writeFile(workbook, "driver_wallet_recharges.xlsx");
  };

  return (
    <>
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Driver Wallet Recharge List</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/" className="new">
                        <i className="ri-group-2-line me-1" /> Driver Recharge List
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Driver Wallet Recharge Listings
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
                        placeholder="Search by driver name..."
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
                  <div className="d-flex justify-content-end mb-3">
                    <CSVLink
                      data={prepareDataForExport()}
                      filename={"driver_wallet_recharges.csv"}
                      className="btn btn-success me-2"
                    >
                      Export to CSV
                    </CSVLink>
                    <button
                      className="btn btn-primary"
                      onClick={handleExcelExport}
                    >
                      Export to Excel
                    </button>
                  </div>
                  <div className="table-responsive table-card border-top">
                    <div data-simplebar="" className="cus-scroll scmob">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.length > 0 ? (
                            payments.map((payment, index) => (
                              <tr key={payment.id}>
                                <td>{(currentPage - 1) * limit + index + 1}</td>
                                <td>{payment.user?.firstName || "N/A"}</td>
                                <td>{payment.user?.lastName || "N/A"}</td>
                                <td>${payment.amount || "0"}</td>
                                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div className="d-flex justify-content-end">
                                    <button
                                      type="button"
                                      className="btn btn-soft-primary px-2 btn-sm me-1"
                                      data-bs-toggle="offcanvas"
                                      data-bs-target="#view-details"
                                      aria-controls="offcanvasRight"
                                      onClick={() => handleViewDetails(payment)}
                                    >
                                      <i className="ri-eye-fill font-size-16"></i>
                                    </button>

                                    <button
                                      onClick={() => deleteDriverWalllet(payment.id)}
                                      className="btn btn-soft-danger px-2 btn-sm"
                                      style={{
                                        backgroundColor: "#ea5455",
                                        borderColor: "#ea5455",
                                        color: "#fff",
                                      }}
                                      title="Delete Wallet Recharge"
                                    >
                                      <i className="ri-delete-bin-line font-size-16"></i>{" "}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                No Driver wallet recharges found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-center align-items-center mt-3">
                        <Stack spacing={2} className="d-flex justify-content-center mt-3">
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

      {/* Driver Wallet Details Offcanvas */}
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
                Driver Wallet Recharge Details
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
          {selectedPayment ? (
            <>
              <table className="table table-borderless" style={{ marginLeft: "-8px" }}>
                <tbody>
                  <tr>
                    <th>First Name:</th>
                    <td className="text-end text-black fw-medium">
                      {selectedPayment.user?.firstName || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Last Name:</th>
                    <td className="text-end text-black fw-medium">
                      {selectedPayment.user?.lastName || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Phone Number:</th>
                    <td className="text-end text-black fw-medium">
                      {selectedPayment.user?.countryCode || ""} {selectedPayment.user?.phoneNumber || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Amount:</th>
                    <td className="text-end text-black fw-medium">
                      ${selectedPayment.amount || "0"}
                    </td>
                  </tr>
                  <tr>
                    <th>Transaction Date:</th>
                    <td className="text-end text-black fw-medium">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="ri-user-line font-size-48 text-muted"></i>
              <p className="mt-3 text-muted">No Driver Wallet Recharge selected</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};


export default DriverWallet;
