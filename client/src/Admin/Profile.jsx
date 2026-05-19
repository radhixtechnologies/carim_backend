import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { axiosInstance, BASE_URL } from "../Config";
import { FaEdit } from "react-icons/fa";

const Profile = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    image: "",
    countryCode: "",
    adminCommission: "",
    rideAmount: "",
    priceRushHour: "",
    parkingCharge: "",
    status: "0",
    otpStatus: 0,
    setKmRange: "",
    priceStatus: 0          // ✅ Number for INT
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);  // Separate loading for status
  const [otpStatusLoading, setOtpStatusLoading] = useState(false);
  const [priceStatusLoading, setpriceStatusLoading] = useState(false); // Separate loading for OTP status
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axiosInstance.get(`/profile`, {});

        if (response.data && response.data.body) {
          const profileData = response.data.body;

          if (profileData.name) {
            const nameParts = profileData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setData({
              ...profileData,
              firstName,
              lastName,
              status: profileData.status ? profileData.status.toString() : "0",
              otpStatus: profileData.otpStatus !== undefined ? profileData.otpStatus : 0,
              priceStatus: profileData.priceStatus !== undefined ? profileData.priceStatus : 0

            });
          } else {
            setData({
              ...profileData,
              status: profileData.status ? profileData.status.toString() : "0",
              otpStatus: profileData.otpStatus !== undefined ? profileData.otpStatus : 0,
              priceStatus: profileData.priceStatus !== undefined ? profileData.priceStatus : 0
            });
          }

          const imageUrl = profileData.image && profileData.image.startsWith("http")
            ? profileData.image
            : `${BASE_URL}/${profileData.image}`;
          setImagePreview(imageUrl);
        }
      } catch (error) {
        toast.error("Error fetching profile data");
      }
    };

    fetchProfileData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateFirstName = (firstName) => {
    if (!firstName.trim()) return "First name is required";
    if (firstName.startsWith(" ")) return "First name cannot start with a space";
    if (firstName.length < 2 || firstName.length > 20)
      return "First name must be between 2 and 20 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(firstName))
      return "First name can only contain letters, spaces, hyphens, and apostrophes";
    return "";
  };

  const validateLastName = (lastName) => {
    if (lastName.trim() === "") return "";

    if (lastName.startsWith(" ")) return "Last name cannot start with a space";
    if (lastName.length > 20)
      return "Last name must be less than 20 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(lastName))
      return "Last name can only contain letters, spaces, hyphens, and apostrophes";
    return "";
  };

  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^[0-9]+$/;
    if (!phoneNumber) return "Phone number is required";
    if (phoneNumber.length < 8 || phoneNumber.length > 15)
      return "Phone number must be between 8 and 15 digits";
    if (!phoneRegex.test(phoneNumber))
      return "Phone number must contain only numbers";
    return "";
  };

  const validateAdminCommission = (commission) => {
    if (!commission && commission !== 0) return "Admin Commission is required";

    const numberRegex = /^[0-9]+$/;
    if (!numberRegex.test(commission))
      return "Admin Commission must contain only numbers";

    const commissionNum = parseInt(commission, 10);
    if (isNaN(commissionNum)) return "Admin Commission must be a valid number";
    if (commissionNum < 0) return "Admin Commission cannot be negative";
    if (commissionNum < 0 || commissionNum > 99)
      return "Admin Commission must be between 0 and 99";

    return "";
  };


  const toggleStatus = async () => {
    setpriceStatusLoading(true);
    const newStatus = data.priceStatus === 0 ? 1 : 0;  // Changed from "0"/"1" to 0/1
    const userId = data.id || localStorage.getItem("userId");

    if (!userId) {
      toast.error("User ID not found");
      setpriceStatusLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(`/pricePushStatus`, {
        id: userId,
        priceStatus: newStatus,
      });

      if (response.data.success) {
        setData(prev => ({ ...prev, priceStatus: newStatus }));
        toast.success(`Status ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      } else {
        toast.error(response.data.message || "Status change failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setpriceStatusLoading(false);
    }
  };


  const otpStatus = async () => {
    setOtpStatusLoading(true);  // Use otpStatusLoading instead of loading
    const newStatuss = data.otpStatus === 0 ? 1 : 0;
    const userId = data.id || localStorage.getItem("userId");

    if (!userId) {
      toast.error("User ID not found");
      setOtpStatusLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post(`/otpStatus`, {
        id: userId,
        otpStatus: newStatuss,
      });

      if (response.data.success) {
        setData(prev => ({ ...prev, otpStatus: newStatuss }));
        toast.success(`OTP Status ${newStatuss === 1 ? 'Activated' : 'Deactivated'} successfully`);
      } else {
        toast.error(response.data.message || "Status change failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setOtpStatusLoading(false);
    }
  };

  const handleFirstNameChange = (e) => {
    const { value } = e.target;
    setData((prevData) => ({ ...prevData, firstName: value }));
    const firstNameError = validateFirstName(value);
    setErrors((prevErrors) => ({ ...prevErrors, firstName: firstNameError }));
  };

  const handleLastNameChange = (e) => {
    const { value } = e.target;
    setData((prevData) => ({ ...prevData, lastName: value }));
    const lastNameError = validateLastName(value);
    setErrors((prevErrors) => ({ ...prevErrors, lastName: lastNameError }));
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    setData((prevData) => ({ ...prevData, phoneNumber: value }));
    const phoneError = validatePhone(value);
    setErrors((prevErrors) => ({ ...prevErrors, phoneNumber: phoneError }));
  };

  const handleAdminCommissionChange = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");
    if (cleanedValue === "" || /^[0-9]+$/.test(cleanedValue)) {
      setData((prevData) => ({ ...prevData, adminCommission: cleanedValue }));
      const commissionError = validateAdminCommission(cleanedValue);
      setErrors((prevErrors) => ({
        ...prevErrors,
        adminCommission: commissionError,
      }));
    }
  };

  const handleRideAmount = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");

    if (cleanedValue === "" || /^\d*\.?\d*$/.test(cleanedValue)) {
      setData((prevData) => ({ ...prevData, rideAmount: cleanedValue }));
    }
  };

  const handleKmRange = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");

    if (cleanedValue === "" || /^\d*\.?\d*$/.test(cleanedValue)) {
      setData((prevData) => ({ ...prevData, setKmRange: cleanedValue }));
    }
  };

  const handlePriceRushHour = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");

    if (cleanedValue === "" || /^[0-9]*\.?[0-9]*$/.test(cleanedValue)) {
      setData((prevData) => ({
        ...prevData,
        priceRushHour: cleanedValue
      }));
    }
  };

  const handleParkingCharge = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");

    if (cleanedValue === "" || /^[0-9]*\.?[0-9]*$/.test(cleanedValue)) {
      setData((prevData) => ({
        ...prevData,
        parkingCharge: cleanedValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let formErrors = {};

    const firstNameError = validateFirstName(data.firstName);
    const lastNameError = validateLastName(data.lastName);
    const phoneError = validatePhone(data.phoneNumber);
    const commissionError = validateAdminCommission(data.adminCommission);

    if (firstNameError) formErrors.firstName = firstNameError;
    if (lastNameError) formErrors.lastName = lastNameError;
    if (phoneError) formErrors.phoneNumber = phoneError;
    if (commissionError) formErrors.adminCommission = commissionError;

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in again.");
      return;
    }

    // Save current values before submit
    const currentStatus = data.status;
    const currentOtpStatus = data.otpStatus;
    const currentpriceStatus = data.priceStatus;

    const fullName = data.lastName.trim() === ""
      ? data.firstName.trim()
      : `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

    const formData = new FormData();
    formData.append("name", fullName);
    formData.append("firstName", data.firstName.trim());
    formData.append("lastName", data.lastName.trim());
    formData.append("email", data.email);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("adminCommission", data.adminCommission);
    formData.append("rideAmount", data.rideAmount);
    formData.append("priceRushHour", data.priceRushHour);
    formData.append("parkingCharge", data.parkingCharge);
    formData.append("status", currentStatus);
    formData.append("otpStatus", currentOtpStatus);
    formData.append("priceStatus", currentpriceStatus);
    formData.append("setKmRange", data.setKmRange);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const response = await axiosInstance.post(`/updateprofile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedData = response.data.body;

      if (updatedData.name) {
        const nameParts = updatedData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setData(prev => ({
          ...prev,
          ...updatedData,
          firstName,
          lastName,
          status: currentStatus,
          otpStatus: currentOtpStatus,
          priceStatus: currentpriceStatus
        }));
      } else {
        setData(prev => ({
          ...prev,
          ...updatedData,
          lastName: updatedData.lastName || "",
          status: currentStatus,
          otpStatus: currentOtpStatus,
          priceStatus: currentpriceStatus
        }));
      }

      if (updatedData.image) {
        const imageUrl = updatedData.image.startsWith("http")
          ? updatedData.image
          : `${BASE_URL}/${updatedData.image}`;
        setImagePreview(imageUrl);
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);

      if (error.response) {
        if (error.response.status === 400) {
          toast.error("Invalid data. Please check your inputs.");
        } else if (error.response.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else {
          toast.error(`Error updating profile: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    }
  };

  return (
    <>
      <ToastContainer autoClose={3000} />

      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Edit Profile</h4>
              </div>
              <div className="row justify-content-center">
                <div className="col-lg-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                        <div>
                          <h5 className="mb-1">Rush Hour </h5>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="statusToggle"
                            checked={data.priceStatus === 1}  // Already correct - comparing with 1
                            onChange={toggleStatus}
                            disabled={priceStatusLoading}
                            style={{
                              width: '3rem',
                              height: '1.5rem',
                              cursor: priceStatusLoading ? 'wait' : 'pointer',
                              backgroundColor: data.priceStatus === 1 ? "#28a745" : "#dc3545",
                              borderColor: data.priceStatus === 1 ? "#28a745" : "#dc3545",
                            }}
                          />
                          {priceStatusLoading && (
                            <span className="ms-2">
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                        <div>
                          <h5 className="mb-1">Static Otp</h5>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`fw-bold ${data.otpStatus === 1 ? "text-success" : "text-danger"
                              }`}
                          >
                            {data.otpStatus === 1 ? "Static" : "twillio"}
                          </span>

                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="otpStatus"
                              checked={data.otpStatus === 1}
                              onChange={otpStatus}
                              disabled={otpStatusLoading}
                              style={{
                                width: "3rem",
                                height: "1.5rem",
                                cursor: otpStatusLoading ? "wait" : "pointer",
                                backgroundColor: data.otpStatus === 1 ? "#28a745" : "#dc3545",
                                borderColor: data.otpStatus === 1 ? "#28a745" : "#dc3545",
                              }}
                            />
                            {otpStatusLoading && (
                              <span className="ms-2">
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <div className="position-relative d-inline-block">
                          <img
                            src={imagePreview || "/default-avatar.png"}
                            style={{
                              width: 200,
                              height: 200,
                              objectFit: "cover",
                              borderRadius: "20%",
                            }}
                            alt="Profile"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            id="fileInput"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                          />
                          <label
                            htmlFor="fileInput"
                            className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
                            style={{ cursor: "pointer" }}
                          >
                            <FaEdit size={20} />
                          </label>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="mb-3 col-6">
                            <label className="mb-1 fw-medium">First Name*</label>
                            <input
                              type="text"
                              className="form-control"
                              name="firstName"
                              value={data.firstName}
                              onChange={handleFirstNameChange}
                              maxLength={20}
                              placeholder="Enter first name"
                            />
                            {errors.firstName && (
                              <div className="text-danger">{errors.firstName}</div>
                            )}
                          </div>

                          <div className="mb-3 col-6">
                            <label className="mb-1 fw-medium">Last Name (Optional)*</label>
                            <input
                              type="text"
                              className="form-control"
                              name="lastName"
                              value={data.lastName}
                              onChange={handleLastNameChange}
                              maxLength={20}
                              placeholder="Enter last name (optional)"
                            />
                            {errors.lastName && (
                              <div className="text-danger">{errors.lastName}</div>
                            )}
                          </div>
                        </div>

                        <div className="row">
                          <div className="mb-3 col-12">
                            <label className="mb-1 fw-medium">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              name="email"
                              value={data.email}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="mb-3 row">
                          <div className="col-2">
                            <label className="mb-1 fw-medium">
                              Country Code
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="countryCode"
                              value={data.countryCode}
                              disabled
                            />
                          </div>
                          <div className="col-10">
                            <label className="mb-1 fw-medium">Phone*</label>
                            <input
                              type="text"
                              className="form-control"
                              name="phoneNumber"
                              value={data.phoneNumber}
                              onChange={handlePhoneChange}
                              placeholder="Enter phone number"
                            />
                            {errors.phoneNumber && (
                              <div className="text-danger">
                                {errors.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label htmlFor="adminCommission" className="mb-1 fw-medium">
                            Admin Commission*
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              name="adminCommission"
                              value={data.adminCommission}
                              onChange={handleAdminCommissionChange}
                              placeholder="Enter commission between 0-99"
                              maxLength={2}
                            />
                            <span className="input-group-text">%</span>
                          </div>
                          {errors.adminCommission && (
                            <div className="text-danger">
                              {errors.adminCommission}
                            </div>
                          )}
                          <div className="form-text">
                            Commission must be a number between 0 and 99 (no
                            spaces or special characters allowed)
                          </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label htmlFor="rideAmount" className="mb-1 fw-medium">
                            Ride Amount
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              name="rideAmount"
                              value={data.rideAmount}
                              onChange={handleRideAmount}
                              placeholder="Enter ride Amount"
                              maxLength={5}
                            />
                          </div>
                          {errors.rideAmount && (
                            <div className="text-danger">
                              {errors.rideAmount}
                            </div>
                          )}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label htmlFor="priceRushHour" className="mb-1 fw-medium">
                            Price Rush Hour
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              name="priceRushHour"
                              value={data.priceRushHour}
                              onChange={handlePriceRushHour}
                              placeholder="Enter Price Rush Hour"
                              maxLength={5}
                            />
                          </div>
                          {errors.priceRushHour && (
                            <div className="text-danger">
                              {errors.priceRushHour}
                            </div>
                          )}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label htmlFor="parkingCharge" className="mb-1 fw-medium">
                            Price Parking
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              name="parkingCharge"
                              value={data.parkingCharge}
                              onChange={handleParkingCharge}
                              placeholder="Enter Price Parking"
                              maxLength={5}
                            />
                          </div>
                          {errors.parkingCharge && (
                            <div className="text-danger">
                              {errors.parkingCharge}
                            </div>
                          )}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <label htmlFor="setKmRange" className="mb-1 fw-medium">
                            Driver Km Range
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              name="setKmRange"
                              value={data.setKmRange}
                              onChange={handleKmRange}
                              placeholder="Enter km"
                              maxLength={3}
                            />
                          </div>
                          {errors.setKmRange && (
                            <div className="text-danger">
                              {errors.setKmRange}
                            </div>
                          )}
                        </div>
                        <div className="text-end mb-2">
                          <button
                            type="submit"
                            className="btn btn-primary px-4"
                          >
                            Update Profile
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

export default Profile;