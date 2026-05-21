import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { axiosInstance } from "../../Config";
import { Link } from "react-router-dom";

const ReportAdd = () => {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    latitude: "",
    longitude: "",
    dropLocation: "",
    dropLatitude: "",
    dropLongitude: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    // Validate pickupLocation
    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = "Pickup location is required.";
    } else if (formData.pickupLocation.length < 2) {
      newErrors.pickupLocation = "Pickup location must be at least 2 characters long.";
    } else if (formData.pickupLocation.length > 255) {
      newErrors.pickupLocation = "Pickup location cannot be longer than 255 characters.";
    }

    // Validate latitude
    if (!formData.latitude.trim()) {
      newErrors.latitude = "Latitude is required.";
    } else if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = "Please enter a valid latitude (-90 to 90).";
    }

    // Validate longitude
    if (!formData.longitude.trim()) {
      newErrors.longitude = "Longitude is required.";
    } else if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = "Please enter a valid longitude (-180 to 180).";
    }

    // Validate dropLocation (optional but if provided, check length)
    if (formData.dropLocation && formData.dropLocation.length > 255) {
      newErrors.dropLocation = "Drop location cannot be longer than 255 characters.";
    }

    // Validate dropLatitude if provided
    if (formData.dropLatitude && (isNaN(formData.dropLatitude) || formData.dropLatitude < -90 || formData.dropLatitude > 90)) {
      newErrors.dropLatitude = "Please enter a valid drop latitude (-90 to 90).";
    }

    // Validate dropLongitude if provided
    if (formData.dropLongitude && (isNaN(formData.dropLongitude) || formData.dropLongitude < -180 || formData.dropLongitude > 180)) {
      newErrors.dropLongitude = "Please enter a valid drop longitude (-180 to 180).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error for this field when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors.");
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/addLocation", formData);

      if (response.status === 200 && response.data.success) {
        toast.success("Location added successfully!");
        setTimeout(() => {
          navigate("/reportlist");
        }, 1500);
      } else {
        toast.error(response.data.message || "Failed to add location.");
      }
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error(
        error.response?.data?.message || "Request failed: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Add New Location</h4>
                <nav aria-label="breadcrumb" className="mt-1">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard" className="new">
                        <i className="ri-home-4-fill me-1" /> Home
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/reportlist" className="new">
                        <i className="ri-map-pin-line me-1" /> Locations
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Add Location
                    </li>
                  </ol>
                </nav>
              </div>

              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Location Information</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        {/* Pickup Location */}
                        <div className="mb-3">
                          <label className="form-label fw-medium">
                            Pickup Location <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.pickupLocation ? "is-invalid" : ""}`}
                            id="pickupLocation"
                            placeholder="Enter pickup location"
                            value={formData.pickupLocation}
                            onChange={handleChange}
                            maxLength={255}
                          />
                          {errors.pickupLocation && (
                            <div className="invalid-feedback">
                              {errors.pickupLocation}
                            </div>
                          )}
                          <small className="text-muted">Maximum 255 characters</small>
                        </div>

                        <div className="row">
                          {/* Latitude */}
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-medium">
                              Latitude <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.latitude ? "is-invalid" : ""}`}
                              id="latitude"
                              placeholder="e.g., 28.6139"
                              value={formData.latitude}
                              onChange={handleChange}
                            />
                            {errors.latitude && (
                              <div className="invalid-feedback">
                                {errors.latitude}
                              </div>
                            )}
                            <small className="text-muted">Range: -90 to 90</small>
                          </div>

                          {/* Longitude */}
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-medium">
                              Longitude <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.longitude ? "is-invalid" : ""}`}
                              id="longitude"
                              placeholder="e.g., 77.2090"
                              value={formData.longitude}
                              onChange={handleChange}
                            />
                            {errors.longitude && (
                              <div className="invalid-feedback">
                                {errors.longitude}
                              </div>
                            )}
                            <small className="text-muted">Range: -180 to 180</small>
                          </div>
                        </div>

                        <div className="mb-3">
                          <hr />
                          <h6 className="mb-3">Drop Location Details (Optional)</h6>
                        </div>

                        {/* Drop Location */}
                        <div className="mb-3">
                          <label className="form-label fw-medium">
                            Drop Location
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.dropLocation ? "is-invalid" : ""}`}
                            id="dropLocation"
                            placeholder="Enter drop location"
                            value={formData.dropLocation}
                            onChange={handleChange}
                            maxLength={255}
                          />
                          {errors.dropLocation && (
                            <div className="invalid-feedback">
                              {errors.dropLocation}
                            </div>
                          )}
                        </div>

                        <div className="row">
                          {/* Drop Latitude */}
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-medium">
                              Drop Latitude
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.dropLatitude ? "is-invalid" : ""}`}
                              id="dropLatitude"
                              placeholder="e.g., 28.7041"
                              value={formData.dropLatitude}
                              onChange={handleChange}
                            />
                            {errors.dropLatitude && (
                              <div className="invalid-feedback">
                                {errors.dropLatitude}
                              </div>
                            )}
                            <small className="text-muted">Range: -90 to 90 (Optional)</small>
                          </div>

                          {/* Drop Longitude */}
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-medium">
                              Drop Longitude
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.dropLongitude ? "is-invalid" : ""}`}
                              id="dropLongitude"
                              placeholder="e.g., 77.1025"
                              value={formData.dropLongitude}
                              onChange={handleChange}
                            />
                            {errors.dropLongitude && (
                              <div className="invalid-feedback">
                                {errors.dropLongitude}
                              </div>
                            )}
                            <small className="text-muted">Range: -180 to 180 (Optional)</small>
                          </div>
                        </div>

                        <div className="text-end mt-3">
                          <Link
                            className="btn btn-secondary px-4 mx-2"
                            to="/reportlist"
                          >
                            Cancel
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary px-4"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Adding...
                              </>
                            ) : (
                              "Add Location"
                            )}
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
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default ReportAdd;