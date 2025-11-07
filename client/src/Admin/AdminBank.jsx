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
    switch (name) {
      case "bankName":
        if (!value.trim()) return "Bank name is required";
        if (value.length < 2 || value.length > 255)
          return "Bank name must be between 2 and 255 characters";
        return "";

      case "accountNumber":
        if (!value.trim()) return "Account number is required";
        if (!/^\d+$/.test(value))
          return "Account number must contain only numbers";
        if (value.length < 5 || value.length > 20)
          return "Account number must be between 5 and 20 digits";
        return "";

      case "holderName":
        if (!value.trim()) return "Holder name is required";
        if (value.length < 2 || value.length > 255)
          return "Holder name must be between 2 and 255 characters";
        return "";

      case "sortCode":
        if (!value.trim()) return "Sort code is required";
        if (!/^[A-Za-z0-9]+$/.test(value))
          return "Sort code must be alphanumeric";
        return "";

      case "postalCode":
        if (!value.trim()) return "Postal code is required";
        if (value.length < 3 || value.length > 20)
          return "Postal code must be between 3 and 20 characters";
        return "";

      case "accountCountry":
        if (!value.trim()) return "Account country is required";
        return "";

      case "currency":
        if (!value.trim()) return "Currency is required";
        if (value.length !== 3)
          return "Currency must be 3 characters (e.g., USD, EUR)";
        return "";

      case "city":
        if (!value.trim()) return "City is required";
        return "";

      case "address":
        if (!value.trim()) return "Address is required";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const validateForm = () => {
    const newErrors = {};

    Object.keys(data).forEach((key) => {
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
      const response = await axiosInstance.post(`/updatebank`, data, {
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
                              maxLength={255}
                            />
                            {errors.bankName && (
                              <div className="text-danger small">
                                {errors.bankName}
                              </div>
                            )}
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
                              maxLength={255}
                            />
                            {errors.accountCountry && (
                              <div className="text-danger small">
                                {errors.accountCountry}
                              </div>
                            )}
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
                              maxLength={3}
                              placeholder="USD, EUR, etc."
                            />
                            {errors.currency && (
                              <div className="text-danger small">
                                {errors.currency}
                              </div>
                            )}
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">
                              Sort Code
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="sortCode"
                              value={data.sortCode}
                              onChange={handleChange}
                              maxLength={50}
                            />
                            {errors.sortCode && (
                              <div className="text-danger small">
                                {errors.sortCode}
                              </div>
                            )}
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
                              maxLength={20}
                            />
                            {errors.accountNumber && (
                              <div className="text-danger small">
                                {errors.accountNumber}
                              </div>
                            )}
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
                              maxLength={255}
                            />
                            {errors.holderName && (
                              <div className="text-danger small">
                                {errors.holderName}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4 mb-3">
                            <label className="mb-1 fw-medium">City</label>
                            <input
                              type="text"
                              className="form-control"
                              name="city"
                              value={data.city}
                              onChange={handleChange}
                              maxLength={255}
                            />
                            {errors.city && (
                              <div className="text-danger small">
                                {errors.city}
                              </div>
                            )}
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
                              maxLength={255}
                            />
                            {errors.address && (
                              <div className="text-danger small">
                                {errors.address}
                              </div>
                            )}
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="mb-1 fw-medium">Postal Code</label>
                            <input
                              type="text"
                              className="form-control"
                              name="postalCode"
                              value={data.postalCode}
                              onChange={handleChange}
                              maxLength={20}
                            />
                            {errors.postalCode && (
                              <div className="text-danger small">
                                {errors.postalCode}
                              </div>
                            )}
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