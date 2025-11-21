import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import "@fancyapps/fancybox/dist/jquery.fancybox.css";
import "@fancyapps/fancybox";
import { axiosInstance, BASE_URL } from "../../Config";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";

const ScreenShotList = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
        `/transferscreenshotlist?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&dateFilter=${filter}`
      );
      if (response.data.success) {
        setTransactions(response.data.body.data || []);
        setTotalPages(response.data.body.totalPages || 1);
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Failed to load screenshot list",
          "error"
        );
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "An error occurred while fetching the screenshot list",
        "error"
      );
    }
  };

  const fetchAllDataForExport = async () => {
    try {
      const response = await axiosInstance.get(
        `/transferscreenshotlist?page=1&limit=10000&search=${encodeURIComponent(
          searchTerm
        )}&dateFilter=${dateFilter}`
      );
      if (response.data.success) {
        return response.data.body.data || [];
      }
      return [];
    } catch (error) {
      toast.error("Failed to fetch data for export");
      return [];
    }
  };

  const prepareDataForExport = async () => {
    const allData = await fetchAllDataForExport();

    const formattedData = allData.map((transaction, index) => ({
      "Sr No.": index + 1,
      "Transaction ID": transaction.id || "",
      "Driver Name": transaction.screenshotdriver?.name || "",
      "Driver Balance ($)": transaction.screenshotdriver?.totalAmount || "0",
      "Transaction Amount ($)": transaction.amount || "0",
      "Added Amount ($)": transaction.addedAmount || "0",
      "Verification Status": getApprovalLabel(transaction.status),
      "Screenshot URL": transaction.image
        ? `${BASE_URL}/${transaction.image}`
        : "No Image",
      "Created Date": transaction.createdAt
        ? new Date(transaction.createdAt).toLocaleDateString()
        : "",
      "Created DateTime": transaction.createdAt
        ? new Date(transaction.createdAt).toLocaleString()
        : "",
    }));

    setExportData(formattedData);
    return formattedData;
  };

  const handleExcelExport = async () => {
    try {
      const data = await prepareDataForExport();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(
        wb,
        `transaction-screenshots-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      toast.error("Failed to export Excel file");
    }
  };

  const handleCSVExport = async () => {
    try {
      await prepareDataForExport();
      toast.success("CSV file is being prepared for download");
    } catch (error) {
      toast.error("Failed to prepare CSV file");
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

  const deleteTransaction = async (id) => {
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
        await axiosInstance.post(`/transferscreenshotdelete/${id}`);
        const response = await axiosInstance.get(
          `/transferscreenshotlist?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(
            searchTerm
          )}&dateFilter=${dateFilter}`
        );

        if (response.data.success) {
          const newData = response.data.body.data || [];
          if (newData.length === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchData(currentPage, searchTerm, dateFilter);
          }
          Swal.fire(
            "Deleted!",
            "Transaction Screen Shot has been deleted.",
            "success"
          );
        }
      } catch (error) {
        Swal.fire(
          "Error!",
          error.response?.data?.message ||
            "Error deleting Transaction screen Shot.",
          "error"
        );
      }
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const getApprovalLabel = (status) => {
    switch (status) {
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

  const getApprovalClass = (status) => {
    switch (status) {
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

  const showVerifyModal = (transaction) => {
    if (transaction.status === "1") {
      toast.info("This transaction is already verified");
      return;
    }
    setPendingVerification(transaction);
    setAddAmount(transaction.amount || "0");
    setShowVerifyPopup(true);
  };

  const handleVerifySubmit = async () => {
    if (!addAmount || isNaN(addAmount) || parseFloat(addAmount) <= 0) {
      toast.error("Please enter a valid amount to add");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axiosInstance.post(`/transferscreenshotstatus`, {
        id: pendingVerification.id,
        status: "1",
        addAmount: parseFloat(addAmount),
      });

      if (response.data.success) {
        fetchData(currentPage, searchTerm, dateFilter);
        setShowVerifyPopup(false);
        setPendingVerification(null);
        setAddAmount("");
        toast.success(
          `Transaction verified successfully and ${parseFloat(
            addAmount
          ).toFixed(2)} added to driver's balance`
        );
      } else {
        toast.error(response.data.message || "Failed to verify transaction");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred while verifying transaction");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (transactionId, newStatus) => {
    if (newStatus === "1") {
      const transaction = transactions.find((t) => t.id === transactionId);
      if (transaction) {
        showVerifyModal(transaction);
      }
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axiosInstance.post(`/transferscreenshotstatus`, {
        id: transactionId,
        status: newStatus,
      });

      if (response.data.success) {
        fetchData(currentPage, searchTerm, dateFilter);
        toast.success(
          `Status changed to ${getApprovalLabel(newStatus)} successfully`
        );
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const calculateNewBalance = () => {
    if (!pendingVerification || !pendingVerification.screenshotdriver)
      return "$0.00";
    const currentBalance = parseFloat(
      pendingVerification.screenshotdriver.totalAmount || 0
    );
    const amountToAdd = parseFloat(addAmount || 0);
    return formatCurrency(currentBalance + amountToAdd);
  };

  return (
    <>
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Transaction Proof List</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/" className="new">
                        <i className="ri-group-2-line me-1" /> Transaction Proof
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Transaction Proof Listings
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

                  <div className="d-flex justify-content-end mb-3">
                    <CSVLink
                      data={exportData}
                      filename={`transaction-screenshots-${
                        new Date().toISOString().split("T")[0]
                      }.csv`}
                      className="btn btn-success me-2"
                      onClick={handleCSVExport}
                    >
                      <i className="ri-file-download-line me-2"></i>
                      Export to CSV
                    </CSVLink>
                    <button
                      className="btn btn-primary"
                      onClick={handleExcelExport}
                    >
                      <i className="ri-file-excel-line me-2"></i>
                      Export to Excel
                    </button>
                  </div>

                  <div className="table-responsive table-card border-top">
                    <div data-simplebar="" className="cus-scroll scmob">
                      <table className="table table-centered cus-nowrap align-middle hltr mb-0">
                        <thead>
                          <tr>
                            <th>Sr no.</th>
                            <th>Image</th>
                            <th>Driver Name</th>
                            <th>Driver Balance($)</th>
                            <th>Add Amount($)</th>
                            <th>Status</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length > 0 ? (
                            transactions.map((transaction, index) => {
                              return (
                                <tr key={transaction.id}>
                                  <td>
                                    {(currentPage - 1) * limit + index + 1}
                                  </td>
                                  <td>
                                    {transaction.image ? (
                                      <img
                                        src={`${BASE_URL}/${transaction.image}`}
                                        alt="Transaction Proof"
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                          borderRadius: "8px",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      "No Image"
                                    )}
                                  </td>
                                  <td>
                                    {transaction.screenshotdriver?.name || ""}
                                  </td>
                                  <td>
                                    {formatCurrency(
                                      transaction.screenshotdriver
                                        ?.totalAmount || 0
                                    )}
                                  </td>
                                  <td>
                                    {formatCurrency(transaction?.amount || 0)}
                                  </td>
                                  <td>
                                    <div className="dropdown">
                                      <button
                                        className={`btn btn-sm dropdown-toggle ${getApprovalClass(
                                          transaction.status
                                        )}`}
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        style={{ minWidth: "100px" }}
                                        disabled={
                                          transaction.status === "1" ||
                                          isProcessing
                                        }
                                      >
                                        {getApprovalLabel(transaction.status)}
                                      </button>
                                      <ul className="dropdown-menu">
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            type="button"
                                            onClick={() =>
                                              handleStatusChange(
                                                transaction.id,
                                                "0"
                                              )
                                            }
                                            disabled={
                                              transaction.status === "0" ||
                                              isProcessing
                                            }
                                          >
                                            <i className="ri-time-line me-2 text-warning"></i>
                                            Pending
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            type="button"
                                            onClick={() =>
                                              handleStatusChange(
                                                transaction.id,
                                                "1"
                                              )
                                            }
                                            disabled={
                                              transaction.status === "1" ||
                                              isProcessing
                                            }
                                          >
                                            <i className="ri-check-line me-2 text-success"></i>
                                            Verified
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="dropdown-item"
                                            type="button"
                                            onClick={() =>
                                              handleStatusChange(
                                                transaction.id,
                                                "2"
                                              )
                                            }
                                            disabled={
                                              transaction.status === "2" ||
                                              isProcessing
                                            }
                                          >
                                            <i className="ri-close-line me-2 text-danger"></i>
                                            Rejected
                                          </button>
                                        </li>
                                      </ul>
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
                                        onClick={() =>
                                          handleViewDetails(transaction)
                                        }
                                      >
                                        <i className="ri-eye-fill font-size-16"></i>
                                      </button>

                                      <button
                                        onClick={() =>
                                          deleteTransaction(transaction.id)
                                        }
                                        className="btn btn-soft-danger px-2 btn-sm"
                                        style={{
                                          backgroundColor: "#ea5455",
                                          borderColor: "#ea5455",
                                          color: "#fff",
                                        }}
                                        title="Delete Transaction"
                                        disabled={isProcessing}
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
                              <td
                                colSpan="7"
                                style={{ textAlign: "center", padding: "20px" }}
                              >
                                No Transaction Proof found
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

      {/* Verify Transaction Modal */}
      {showVerifyPopup && pendingVerification && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Verify Transaction</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowVerifyPopup(false);
                    setPendingVerification(null);
                    setAddAmount("");
                  }}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Current Driver Balance:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formatCurrency(
                      pendingVerification.screenshotdriver?.totalAmount || 0
                    )}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Amount to Add:
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Enter amount to add"
                    min="0"
                    step="0.01"
                    disabled={isProcessing}
                  />
                  <div className="form-text">
                    This amount will be added to the driver's balance upon
                    verification.
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">
                    New Balance After Verification:
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={calculateNewBalance()}
                    disabled
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowVerifyPopup(false);
                    setPendingVerification(null);
                    setAddAmount("");
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleVerifySubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Verify & Add Amount"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Offcanvas */}
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
                Transaction Proof Details
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
          {selectedTransaction ? (
            <>
              <div className="scroll-room mb-3" id="scrollRoom">
                {selectedTransaction.image ? (
                  <a
                    href={`${BASE_URL}/${selectedTransaction.image}`}
                    data-fancybox="gallery"
                    className="image-popup-gallery-item"
                  >
                    <img
                      src={`${BASE_URL}/${selectedTransaction.image}`}
                      className="img-fluid rounded"
                      alt="Transaction Proof"
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                ) : (
                  <div
                    className="bg-light rounded d-flex align-items-center justify-content-center"
                    style={{ height: "200px" }}
                  >
                    <span className="text-muted">No Image Available</span>
                  </div>
                )}
              </div>
              <table
                className="table table-borderless"
                style={{ marginLeft: "-8px" }}
              >
                <tbody>
                  <tr>
                    <td>Transaction ID:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedTransaction.id}
                    </td>
                  </tr>
                  <tr>
                    <td>Driver Name:</td>
                    <td className="text-end text-black fw-medium">
                      {selectedTransaction.screenshotdriver?.name || ""}
                    </td>
                  </tr>
                  <tr>
                    <td>Driver Balance:</td>
                    <td className="text-end text-black fw-medium">
                      {formatCurrency(
                        selectedTransaction.screenshotdriver?.totalAmount || 0
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Transaction Amount:</td>
                    <td className="text-end text-black fw-medium">
                      {formatCurrency(selectedTransaction.amount)}
                    </td>
                  </tr>
                  <tr>
                    <td>Verification Status:</td>
                    <td className="text-end">
                      <span
                        className={`badge ${getApprovalClass(
                          selectedTransaction.status
                        )}`}
                      >
                        {getApprovalLabel(selectedTransaction.status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="ri-image-line font-size-48 text-muted"></i>
              <p className="mt-3 text-muted">No Transaction Proof selected</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ScreenShotList;
