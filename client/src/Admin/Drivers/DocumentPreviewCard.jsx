import React, { useEffect, useState } from "react";
import { isImageFile, isPdfFile, resolveMediaUrl } from "../../utils/mediaUrl";

function DocumentPreviewCard({ title, filePath }) {
  const resolvedUrl = resolveMediaUrl(filePath);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  const handleImageClick = (e) => {
    e.preventDefault();
    if (!resolvedUrl) return;
    if (window.$ && window.$.fancybox) {
      window.$.fancybox.open([{ src: resolvedUrl, type: "image" }]);
    } else if (window.Fancybox) {
      window.Fancybox.show([{ src: resolvedUrl, type: "image" }]);
    } else {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="mb-3 p-3 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong className="small text-dark">{title}</strong>
        {resolvedUrl ? (
          <span className="badge bg-success-subtle text-success">Uploaded</span>
        ) : (
          <span className="badge bg-secondary-subtle text-secondary">Not Uploaded</span>
        )}
      </div>

      {!resolvedUrl ? (
        <div className="text-muted small py-2">No document uploaded by driver yet.</div>
      ) : isImageFile(resolvedUrl) && !imgError ? (
        <div>
          <a
            href={resolvedUrl}
            onClick={handleImageClick}
            className="d-block mb-2"
            title="Click to zoom"
          >
            <img
              src={resolvedUrl}
              alt={title}
              className="img-fluid rounded border"
              style={{ maxHeight: "170px", width: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          </a>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={handleImageClick}
              className="btn btn-sm btn-outline-primary"
            >
              Zoom
            </button>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary"
            >
              Open in New Tab
            </a>
          </div>
        </div>
      ) : imgError ? (
        <div className="alert alert-warning py-2 px-3 mb-0 small">
          <div className="fw-semibold mb-1">File unavailable / not found on server</div>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-dark mt-1"
          >
            Try Direct Link
          </a>
        </div>
      ) : (
        <div className="d-flex align-items-center justify-content-between bg-white p-2 rounded border">
          <span className="small fw-medium text-secondary">
            {isPdfFile(resolvedUrl) ? "PDF Document" : "Document File"}
          </span>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            View File
          </a>
        </div>
      )}
    </div>
  );
}

export default DocumentPreviewCard;
