import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { axiosInstance, BASE_URL } from "../../Config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCloudUploadAlt } from "react-icons/fa";

const TutorialEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    title: "",
    price: "",
    description: "",
  });
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [fileError, setFileError] = useState("");

  const totalFiles = existingFiles.length + newFiles.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/tutorialdetail/${id}`);
        if (response.data.success) {
          const tutorialData = response.data.body;
          setData({
            title: tutorialData.title || "",
            price: tutorialData.price || "",
            description: tutorialData.description || "",
          });

          if (
            tutorialData.tutorialImages &&
            tutorialData.tutorialImages.length > 0
          ) {
            const existingPreviews = tutorialData.tutorialImages.map(
              (file) => ({
                url: `${BASE_URL}/${file.image}`,
                type: file.image.match(/\.(jpg|jpeg|png)$/i)
                  ? "image"
                  : "video",
                name: file.image,
                id: file.id,
                isExisting: true,
              })
            );
            setFilePreviews(existingPreviews);
            setExistingFiles(
              tutorialData.tutorialImages.map((file) => ({
                id: file.id,
                image: file.image,
              }))
            );
          }
        } else {
          toast.error("Failed to fetch tutorial data.");
        }
      } catch (error) {
        toast.error("Error fetching tutorial data.");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileSelection = (files) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "video/mp4",
      "video/avi",
      "video/quicktime",
    ];

    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (totalFiles + validFiles.length > 10) {
      setFileError("Maximum 10 files allowed");
      return;
    }

    const oversizedFiles = validFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setFileError("Some files exceed 5MB limit");
      return;
    }

    setNewFiles((prev) => [...prev, ...validFiles]);

    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") ? "image" : "video",
      name: file.name,
      isExisting: false,
      file: file,
    }));

    setFilePreviews((prev) => [...prev, ...newPreviews]);

    if (validFiles.length !== files.length) {
      setFileError("Only JPG, PNG images, or MP4, AVI videos are allowed.");
    } else {
      setFileError("");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "files") {
      if (files && files.length > 0) {
        handleFileSelection(Array.from(files));
      }
      e.target.value = "";
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeAllFiles = async () => {
    try {
      filePreviews.forEach((preview, index) => {
        if (!preview.isExisting) {
          URL.revokeObjectURL(preview.url);
        }
      });

      setNewFiles([]);
      setFilePreviews(
        existingFiles.map((file) => ({
          url: `${BASE_URL}/${file.image}`,
          type: file.image.match(/\.(jpg|jpeg|png)$/i) ? "image" : "video",
          name: file.image,
          id: file.id,
          isExisting: true,
        }))
      );
      setFileError("");

      toast.success("All new files removed successfully!");
    } catch (error) {
      toast.error("Error removing files");
    }
  };

  const removeFile = async (indexToRemove) => {
    const fileToRemove = filePreviews[indexToRemove];

    if (fileToRemove.isExisting) {
      try {
        const response = await axiosInstance.post(
          `/imagedelete/${fileToRemove.id}`
        );

        if (response.data.success) {
          setExistingFiles((prev) =>
            prev.filter((file) => file.id !== fileToRemove.id)
          );
          setFilePreviews((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
          );
          toast.success("File deleted successfully!");
        } else {
          toast.error("Failed to delete file");
        }
      } catch (error) {
        toast.error("Error deleting file");
      }
    } else {
      const newFileIndex = indexToRemove - existingFiles.length;
      URL.revokeObjectURL(fileToRemove.url);

      setNewFiles((prev) => prev.filter((_, index) => index !== newFileIndex));
      setFilePreviews((prev) =>
        prev.filter((_, index) => index !== indexToRemove)
      );
      toast.success("File removed successfully!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTitleError("");
    setPriceError("");
    setDescriptionError("");
    setFileError("");

    let hasError = false;

    if (!data.title.trim()) {
      setTitleError("Title is required.");
      hasError = true;
    }
    if (!data.price.trim()) {
      setPriceError("Price is required.");
      hasError = true;
    }
    if (!data.description.trim()) {
      setDescriptionError("Description is required.");
      hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append("title", data.title.trim());
    formData.append("price", data.price.trim());
    formData.append("description", data.description.trim());

    newFiles.forEach((file) => {
      formData.append("image", file);
    });

    try {
      const response = await axiosInstance.post(
        `/tutorialupdate/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Tutorial updated successfully!");
        setTimeout(() => navigate("/tutoriallist"), 1000);
      } else {
        toast.error(response.data.message || "Tutorial update failed.");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        "Request failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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
                <h4 className="mb-0 page-title">Edit Tutorial</h4>
              </div>
              <div className="row justify-content-center">
                <div className="col-lg-12">
                  <div className="card">
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="mb-1 fw-medium">
                            Tutorial Title
                          </label>
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
                            <div className="text-danger small mt-1">
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
                            <div className="text-danger small mt-1">
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
                            <div className="text-danger small mt-1">
                              {descriptionError}
                            </div>
                          )}
                        </div>

                        {/* Drag and Drop File Upload Section */}
                        <div className="form-group mb-3">
                          <label className="mb-2 fw-medium">
                            Tutorial Files * ({totalFiles}/10 files)
                          </label>

                          <div
                            className={`border-dashed border-2 p-4 text-center mb-3 ${
                              dragOver
                                ? "border-primary bg-light"
                                : "border-secondary"
                            } ${fileError ? "border-danger" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                              borderStyle: "dashed",
                              borderRadius: "8px",
                              backgroundColor: dragOver
                                ? "#f8f9fa"
                                : "transparent",
                            }}
                          >
                            <div className="mb-2">
                              <FaCloudUploadAlt className="fa-2x text-muted" />
                            </div>
                            <p className="mb-2">
                              <strong>
                                Drag and drop files here or click to browse
                              </strong>
                            </p>
                            <p className="text-muted small">
                              Maximum 10 files, 5MB each (JPG, JPEG, PNG, MP4,
                              AVI)
                            </p>
                            <input
                              type="file"
                              name="files"
                              multiple
                              accept="image/jpeg,image/jpg,image/png,video/mp4,video/avi,video/quicktime"
                              onChange={handleChange}
                              className="form-control-file"
                              style={{ display: "none" }}
                              id="fileUpload"
                            />
                            <label
                              htmlFor="fileUpload"
                              className="btn btn-outline-primary"
                            >
                              Choose Files
                            </label>
                          </div>

                          {fileError && (
                            <small className="text-danger d-block mb-2">
                              {fileError}
                            </small>
                          )}

                          {totalFiles > 0 && (
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="badge badge-info">
                                {totalFiles} file
                                {totalFiles !== 1 ? "s" : ""} selected
                                {existingFiles.length > 0 && (
                                  <span>
                                    {" "}
                                    ({existingFiles.length} existing,{" "}
                                    {newFiles.length} new)
                                  </span>
                                )}
                              </span>
                              {newFiles.length > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={removeAllFiles}
                                >
                                  Clear New Files
                                </button>
                              )}
                            </div>
                          )}

                          {filePreviews.length > 0 && (
                            <div className="mt-3">
                              <label className="mb-2 fw-medium">
                                File Previews:
                              </label>
                              <div className="row">
                                {filePreviews.map((preview, index) => (
                                  <div
                                    key={index}
                                    className="col-md-3 col-sm-4 col-6 mb-3"
                                  >
                                    <div className="position-relative">
                                      {preview.type === "image" ? (
                                        <img
                                          src={preview.url}
                                          alt={`Preview ${index + 1}`}
                                          className="img-fluid img-thumbnail"
                                          style={{
                                            height: "150px",
                                            objectFit: "cover",
                                            width: "100%",
                                            borderRadius: "8px",
                                          }}
                                        />
                                      ) : (
                                        <video
                                          src={preview.url}
                                          className="img-fluid img-thumbnail"
                                          style={{
                                            height: "150px",
                                            objectFit: "cover",
                                            width: "100%",
                                            borderRadius: "8px",
                                          }}
                                        >
                                          Your browser does not support the
                                          video tag.
                                        </video>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute"
                                        style={{
                                          top: "5px",
                                          right: "5px",
                                          borderRadius: "50%",
                                          width: "30px",
                                          height: "30px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: "0",
                                        }}
                                        onClick={() => removeFile(index)}
                                        title="Remove File"
                                      >
                                        ×
                                      </button>
                                      <div
                                        className="position-absolute bg-dark text-white px-2 py-1"
                                        style={{
                                          bottom: "5px",
                                          left: "5px",
                                          fontSize: "12px",
                                          borderRadius: "4px",
                                          opacity: "0.8",
                                        }}
                                      >
                                        {index + 1}
                                        {preview.isExisting && (
                                          <span className="text-warning ms-1">
                                            ★
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-center mt-1">
                                      <small className="text-muted">
                                        {preview.isExisting ? (
                                          <span className="text-warning">
                                            Existing File
                                          </span>
                                        ) : (
                                          preview.name
                                        )}
                                      </small>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="d-flex justify-content-end">
                          <Link
                            className="btn btn-secondary px-4 mx-2"
                            to="/tutoriallist"
                          >
                            Back
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary px-4"
                          >
                            Update Tutorial
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

export default TutorialEdit;
