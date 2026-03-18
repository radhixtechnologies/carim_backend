import React, { useState, useEffect } from "react";
import { axiosInstance } from "../../Config";

const AboutUsApp = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p><br></p>");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        const response = await axiosInstance.get(`/aboutus`);
        const { data } = response.data;
        setTitle(data.title || "");
        setContent(data.content || "<p><br></p>");
      } catch (error) {
        console.error("Error fetching About Us data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutUs();
  }, []);

  return (
    <div id="layout-wrapper">
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="title-box mb-3 pb-1">
              <h4 className="mb-0 page-title">About Us</h4>
            </div>
            <div className="row justify-content-center">
              <div className="col-lg-12">
                <div className="card">
                  <div className="card-body">
                    {loading ? (
                      <p>Loading...</p>
                    ) : (
                      <>
                        <div className="mb-3">
                          <label className="mb-1 fw-medium">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={title}
                            disabled
                            readOnly
                          />
                        </div>
                        <div className="row mb-2">
                          <div className="col-12">
                            <div className="form-group">
                              <label htmlFor="content">Content</label>
                              <div 
                                className="about-us-content p-3 border rounded"
                                style={{ 
                                  minHeight: "200px",
                                  backgroundColor: "#f8f9fa"
                                }}
                              >
                                <div dangerouslySetInnerHTML={{ __html: content }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsApp;