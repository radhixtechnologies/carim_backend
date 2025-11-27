import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { axiosInstance } from "../Config";

const AdminBank = () => {
  const [data, setData] = useState({
    accountType: "1",
    bankName: "",
    accountCountry: "",
    currency: "",
    sortCode: "",
    accountNumber: "",
    accountOwnerInfo: "1",
    holderName: "",
    city: "",
    address: "",
    postalCode: "",
    isDefault: "0",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBankData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/bankdetails`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.body) {
          const bankData = response.data.body.bankuser || {};
          setData((prevData) => ({
            ...prevData,
            ...bankData,
          }));
        }
      } catch (error) {
        console.error("Error fetching bank data:", error);
        toast.error("Error fetching bank details");
      }
      setLoading(false);
    };

    fetchBankData();
  }, []);

  const validateField = (name, value) => {
    if (!value.trim()) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }

    if (/^\s+$/.test(value)) {
      return "Only spaces are not allowed. Please enter valid text";
    }

    if (value.length > 60) {
      return `Maximum 60 characters allowed`;
    }

    switch (name) {
      case "bankName":
        if (value.length < 2)
          return "Bank name must be at least 2 characters";
        return "";

      case "accountNumber":
        if (!/^\d+$/.test(value.trim()))
          return "Account number must contain only numbers";
        if (value.trim().length < 5 || value.trim().length > 20)
          return "Account number must be between 5 and 20 digits";
        return "";

      case "holderName":
        if (value.length < 2)
          return "Holder name must be at least 2 characters";
        return "";

      case "sortCode":
        if (!/^[A-Za-z0-9]+$/.test(value.trim()))
          return "Sort code must be alphanumeric";
        return "";

      case "postalCode":
        if (value.length < 3)
          return "Postal code must be at least 3 characters";
        return "";

      case "accountCountry":
        return "";

      case "currency":
        if (value.trim().length !== 3)
          return "Currency must be 3 characters (e.g., USD, EUR)";
        return "";

      case "city":
        return "";

      case "address":
        return "";

      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (value.length > 60) {
      return;
    }

    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    const error = validateField(name, value);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ' && !e.target.value.trim()) {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(data).forEach((key) => {
      if (['accountType', 'accountOwnerInfo', 'isDefault'].includes(key)) {
        return;
      }
      
      const error = validateField(key, data[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(`/updatebank`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Bank details updated successfully");
      navigate("/bankdetail");
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error("Error updating bank details");
    }
    setLoading(false);
  };

  return (
    <>
      <ToastContainer autoClose={3000} />

      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Admin Bank Details</h4>
              </div>
              <div className="row justify-content-center">
                <div className="col-lg-12">
                  <div className="card">
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">
                              Account Type
                            </label>
                            <select
                              className="form-select"
                              name="accountType"
                              value={data.accountType}
                              onChange={handleChange}
                            >
                              <option value="1">Saving Account</option>
                              <option value="0">Current Account</option>
                            </select>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">Bank Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="bankName"
                              value={data.bankName}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter bank name (max 60 characters)"
                            />
                            {errors.bankName && (
                              <div className="text-danger small">
                                {errors.bankName}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.bankName.length}/60
                            </div>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">
                              Account Country
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="accountCountry"
                              value={data.accountCountry}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter country (max 60 characters)"
                            />
                            {errors.accountCountry && (
                              <div className="text-danger small">
                                {errors.accountCountry}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.accountCountry.length}/60
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">Currency</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currency"
                              value={data.currency}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={3}
                              placeholder="USD, EUR, etc. (3 characters)"
                            />
                            {errors.currency && (
                              <div className="text-danger small">
                                {errors.currency}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.currency.length}/3
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">Sort Code</label>
                            <input
                              type="text"
                              className="form-control"
                              name="sortCode"
                              value={data.sortCode}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter sort code (max 60 characters)"
                            />
                            {errors.sortCode && (
                              <div className="text-danger small">
                                {errors.sortCode}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.sortCode.length}/60
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">
                              Account Number
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="accountNumber"
                              value={data.accountNumber}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={20}
                              placeholder="Enter account number"
                            />
                            {errors.accountNumber && (
                              <div className="text-danger small">
                                {errors.accountNumber}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.accountNumber.length}/20
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="holderName"
                              value={data.holderName}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter holder name (max 60 characters)"
                            />
                            {errors.holderName && (
                              <div className="text-danger small">
                                {errors.holderName}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.holderName.length}/60
                            </div>
                          </div>

                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">City</label>
                            <input
                              type="text"
                              className="form-control"
                              name="city"
                              value={data.city}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter city (max 60 characters)"
                            />
                            {errors.city && (
                              <div className="text-danger small">
                                {errors.city}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.city.length}/60
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">Address</label>
                            <input
                              type="text"
                              className="form-control"
                              name="address"
                              value={data.address}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={60}
                              placeholder="Enter address (max 60 characters)"
                            />
                            {errors.address && (
                              <div className="text-danger small">
                                {errors.address}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.address.length}/60
                            </div>
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="postalCode"
                              value={data.postalCode}
                              onChange={handleChange}
                              onKeyPress={handleKeyPress}
                              maxLength={20}
                              placeholder="Enter postal code"
                            />
                            {errors.postalCode && (
                              <div className="text-danger small">
                                {errors.postalCode}
                              </div>
                            )}
                            <div className="text-end small text-muted">
                              {data.postalCode.length}/20
                            </div>
                          </div>
                        </div>

                        <div className="text-end mb-2">
                          <button
                            type="submit"
                            className="btn btn-primary px-4"
                            disabled={loading}
                          >
                            {loading ? "Updating..." : "Update Bank Details"}
                          </button>
                        </div>
                      </form>
                    </div>
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

export default AdminBank;