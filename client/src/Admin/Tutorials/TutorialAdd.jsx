import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { axiosInstance } from "../../Config";

const TutorialAdd = () => {
  const [data, setData] = useState({
    title: "",
    price: "",
    description: "",
    image: [],  
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [titleError, setTitleError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [fileError, setFileError] = useState("");
  const navigate = useNavigate();

  const validateTitle = (title) => {
    const trimmedTitle = title.trim();
    const errors = [];

    if (!trimmedTitle) {
      errors.push("Tutorial title is required.");
    } else {
      if (!/^[A-Za-z]/.test(trimmedTitle))
        errors.push("Title must start with a letter.");
      if (trimmedTitle.length < 3 || trimmedTitle.length > 50)
        errors.push("Title must be between 3 and 50 characters.");
      if (!/^[A-Za-z0-9@#&!()_\-., ]+$/.test(trimmedTitle))
        errors.push(
          "Title contains invalid characters. Only letters, numbers, spaces, and @#&!()_-., are allowed."
        );
    }

    setTitleError(errors.join(" "));
    return errors.length === 0;
  };

  const validatePrice = (price) => {
    const trimmedPrice = price.trim();
    const errors = [];
    
    if (!trimmedPrice) {
      errors.push("Price is required.");
    } else {
      if (!/^\d*\.?\d+$/.test(trimmedPrice)) {
        errors.push("Price must be a valid number.");
      } else {
        const numericPrice = parseFloat(trimmedPrice);
        if (numericPrice < 0) {
          errors.push("Price cannot be negative.");
        }
        if (numericPrice === 0) {
          errors.push("Price must be greater than zero.");
        }
      }
    }
    
    setPriceError(errors.join(" "));
    return errors.length === 0;
  };

  const validateDescription = (description) => {
    const errors = [];
    if (!description.trim()) {
      errors.push("Description is required.");
    } else if (description.length < 10) {
      errors.push("Description must be at least 10 characters.");
    }
    setDescriptionError(errors.join(" "));
    return errors.length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") { 
      const selectedFiles = Array.from(files);
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "video/mp4", "video/avi", "video/quicktime"];

      const validFiles = selectedFiles.filter((file) =>
        allowedTypes.includes(file.type)
      );

      setData((prev) => ({
        ...prev,
        image: [...prev.image, ...validFiles],  
      }));

      const newPreviews = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("image") ? "image" : "video",
        name: file.name,
      }));

      setFilePreviews((prev) => [...prev, ...newPreviews]);

      if (validFiles.length !== selectedFiles.length) {
        setFileError("Only JPG, PNG images, or MP4, AVI videos are allowed.");
      } else {
        setFileError("");
      }
    } else if (name === "title") {
      setData((prev) => ({ ...prev, title: value }));
      if (titleError) setTitleError("");
    } else if (name === "price") {
      setData((prev) => ({ ...prev, price: value }));
      if (priceError) setPriceError("");
    } else if (name === "description") {
      setData((prev) => ({ ...prev, description: value }));
      if (descriptionError) setDescriptionError("");
    }
  };

  const removeFile = (index) => {
    setData((prev) => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== index),  
    }));

    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index].url);
    }

    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTitleError("");
    setPriceError("");
    setDescriptionError("");
    setFileError("");

    const isTitleValid = validateTitle(data.title);
    const isPriceValid = validatePrice(data.price);
    const isDescriptionValid = validateDescription(data.description);

    let isFileValid = true;
    if (data.image.length === 0) {  
      setFileError("At least one tutorial image or video is required.");
      isFileValid = false;
    }

    if (!isTitleValid || !isPriceValid || !isDescriptionValid || !isFileValid) {
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title.trim());
    formData.append("price", data.price.trim());
    formData.append("description", data.description.trim());

    data.image.forEach((file) => {  
      formData.append("image", file); 
    });

    try {
      const response = await axiosInstance.post("/createtutorial", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 && response.data.success) {
        toast.success("Tutorial added successfully!");

        filePreviews.forEach((preview) => {
          URL.revokeObjectURL(preview.url);
        });

        setTimeout(() => navigate("/tutorialList"), 1000);
      } else {
        toast.error(response.data.message || "Tutorial creation failed.");
      }
    } catch (error) {
      toast.error("Request failed: " + error.message);
    }
  };

  return (
    <>
      <div id="layout-wrapper">
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              <div className="title-box mb-3 pb-1">
                <h4 className="mb-0 page-title">Add Tutorial</h4>
              </div>
              <div className="row justify-content-center">
                <div className="col-lg-12">
                  <div className="card">
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="mb-1 fw-medium">Tutorial Title</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={data.title}
                            onChange={handleChange}
                            maxLength={50}
                            placeholder="Enter tutorial title"
                          />
                          {titleError && (
                            <div
                              style={{
                                color: "red",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              {titleError}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="mb-1 fw-medium">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control"
                            name="price"
                            value={data.price}
                            onChange={handleChange}
                            placeholder="Enter price"
                          />
                          {priceError && (
                            <div
                              style={{
                                color: "red",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              {priceError}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="mb-1 fw-medium">Description</label>
                          <textarea
                            className="form-control"
                            name="description"
                            value={data.description}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Enter tutorial description"
                          />
                          {descriptionError && (
                            <div
                              style={{
                                color: "red",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              {descriptionError}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="mb-2 fw-medium">Select Tutorial Files (Image/Video)</label>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            id="image"  
                            name="image" 
                            multiple
                            style={{ display: "none" }}
                            onChange={handleChange}
                          />
                          <label htmlFor="image" className="btn btn-outline-primary btn-sm">
                            Choose Files
                          </label>
                          {fileError && (
                            <div
                              style={{
                                color: "red",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              {fileError}
                            </div>
                          )}
                        </div>

                        {filePreviews.length > 0 && (
                          <div className="mb-3">
                            <label className="mb-2 fw-medium">File Previews:</label>
                            <div className="row">
                              {filePreviews.map((preview, index) => (
                                <div key={index} className="col-md-3 col-sm-4 col-6 mb-3 position-relative">
                                  <div className="card">
                                    <div className="card-body p-2">
                                      {preview.type === "image" ? (
                                        <img
                                          src={preview.url}
                                          alt={`Preview ${index + 1}`}
                                          className="img-fluid rounded"
                                          style={{
                                            width: "100%",
                                            height: "150px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : (
                                        <video
                                          src={preview.url}
                                          controls
                                          className="img-fluid rounded"
                                          style={{
                                            width: "100%",
                                            height: "150px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      )}
                                      <div className="mt-1 small text-truncate" title={preview.name}>
                                        {preview.name}
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute"
                                        style={{ top: "5px", right: "5px" }}
                                        onClick={() => removeFile(index)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="d-flex justify-content-end">
                          <Link
                            className="btn btn-secondary px-4 mx-2"
                            to="/tutoriallist"
                          >
                            Back
                          </Link>
                          <button type="submit" className="btn btn-primary px-4">
                            Add Tutorial
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

      <ToastContainer />
    </>
  );
};

export default TutorialAdd;
