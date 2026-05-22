import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { axiosInstance } from "../../Config";
import { Link } from "react-router-dom";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

// Temporary default center (will be replaced immediately by user's location)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
};

const ReportAdd = () => {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // Start with null
  const [pickupMarker, setPickupMarker] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading"); // loading, success, error

  const pickupAutocompleteRef = useRef(null);
  const pickupInputRef = useRef(null); // ADDED: Reference to input field
  const navigate = useNavigate();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Get user's current location immediately on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = { lat: latitude, lng: longitude };
          setMapCenter(userLoc);
          setLocationStatus("success");
          toast.success(`📍 Location detected! Map centered to your location`, {
            position: "top-right",
            autoClose: 3000,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to get your location. ";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please allow location access and refresh the page.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please try again.";
              break;
            default:
              errorMessage += "Please check your location settings.";
          }

          setLocationStatus("error");
          toast.error(errorMessage, {
            autoClose: 5000,
          });
          // Still set a default center so map shows something
          setMapCenter(defaultCenter);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationStatus("error");
      toast.error("Geolocation is not supported by your browser");
      setMapCenter(defaultCenter);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = "Pickup location is required.";
    } else if (formData.pickupLocation.length < 2) {
      newErrors.pickupLocation = "Pickup location must be at least 2 characters long.";
    } else if (formData.pickupLocation.length > 255) {
      newErrors.pickupLocation = "Pickup location cannot be longer than 255 characters.";
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = "Latitude is required.";
    } else if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = "Please enter a valid latitude (-90 to 90).";
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = "Longitude is required.";
    } else if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = "Please enter a valid longitude (-180 to 180).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const onPickupLoad = (autocomplete) => {
    pickupAutocompleteRef.current = autocomplete;
  };

  // FIXED: This is the main fix - keeps user's typed text instead of Google's official name
  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place && place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // IMPORTANT FIX: Get the actual text user typed in the input field
        // This prevents "Mohali" from changing to "Sahibzada Ajit Singh Nagar"
        const userTypedText = pickupInputRef.current ? pickupInputRef.current.value : "";

        // Use user's typed text as the display address, fallback to Google's address if empty
        const address = userTypedText || place.formatted_address || place.name;

        setFormData(prev => ({
          ...prev,
          pickupLocation: address,  // This will keep "Mohali, Punjab, India"
          latitude: lat.toString(),
          longitude: lng.toString()
        }));

        setSelectedPickup({ lat, lng });
        setPickupMarker({ lat, lng });
        setMapCenter({ lat, lng });

        setErrors(prev => ({
          ...prev,
          pickupLocation: "",
          latitude: "",
          longitude: ""
        }));
      }
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;

        setFormData(prev => ({
          ...prev,
          pickupLocation: address,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        setSelectedPickup({ lat, lng });
        setPickupMarker({ lat, lng });
        setMapCenter({ lat, lng });
        toast.success("Pickup location set");
      }
    });
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

  const clearPickup = () => {
    setSelectedPickup(null);
    setPickupMarker(null);
    setFormData(prev => ({
      ...prev,
      pickupLocation: "",
      latitude: "",
      longitude: ""
    }));
    // Clear the input field reference as well
    if (pickupInputRef.current) {
      pickupInputRef.current.value = "";
    }
    toast.info("Pickup location cleared");
  };

  const centerToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentLoc = { lat: latitude, lng: longitude };
          setMapCenter(currentLoc);
          toast.success("📍 Map centered to your current location");
        },
        (error) => {
          toast.error("Unable to get your current location");
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  if (loadError) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Error loading Google Maps. Please check your API key.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Maps...</span>
        </div>
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  if (!mapCenter) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Getting your location...</span>
        </div>
        <p className="mt-3">Getting your current location...</p>
        <p className="text-muted small">Please allow location access when prompted</p>
      </div>
    );
  }

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

              <div className="row">
                <div className="col-lg-12 mb-4">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0">
                        <i className="ri-map-pin-line me-2"></i>
                        Select Pickup Location on Map
                      </h5>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={centerToCurrentLocation}
                      >
                        <i className="ri-crosshair-line me-1"></i>
                        My Location
                      </button>
                    </div>
                    <div className="card-body p-0">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={14}
                        options={mapOptions}
                        onClick={handleMapClick}
                      >
                        {pickupMarker && (
                          <Marker
                            position={pickupMarker}
                            label={{
                              text: "P",
                              color: "white",
                              fontWeight: "bold",
                            }}
                            title="Pickup Location"
                          />
                        )}
                      </GoogleMap>
                    </div>
                    <div className="card-footer bg-light">
                      <small className="text-muted">
                        <i className="ri-information-line me-1"></i>
                        <strong>Instructions:</strong> Click on map or search below to set pickup location. You can update the location anytime by clicking on a new spot or searching.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-lg-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Location Information</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        {/* Pickup Location with Autocomplete */}
                        <div className="mb-3">
                          <label className="form-label fw-medium">
                            Pickup Location <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <Autocomplete
                              onLoad={onPickupLoad}
                              onPlaceChanged={onPickupPlaceChanged}
                              options={{
                                types: ["geocode", "establishment"],
                                componentRestrictions: { country: "in" },
                              }}
                            >
                              <input
                                ref={pickupInputRef}  // ADDED: Reference to get user's typed text
                                type="text"
                                className={`form-control ${errors.pickupLocation ? "is-invalid" : ""}`}
                                id="pickupLocation"
                                placeholder="Search pickup location..."
                                value={formData.pickupLocation}
                                onChange={handleChange}
                                maxLength={255}
                                style={{ width: "500px" }}
                              />
                            </Autocomplete>
                            {selectedPickup && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={clearPickup}
                                title="Clear pickup location"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            )}
                          </div>
                          {errors.pickupLocation && (
                            <div className="invalid-feedback d-block">
                              {errors.pickupLocation}
                            </div>
                          )}
                          <small className="text-muted">
                            <i className="ri-search-line me-1"></i>
                            Search for a place or click on map to set pickup location
                          </small>
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