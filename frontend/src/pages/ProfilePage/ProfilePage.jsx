import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import apiClient from "../../apiClient";
import AuthBar from "../../components/AuthBar/AuthBar";
import {
  compressImageFileToJpegBlob,
  uploadProfilePhotoViaPresignedUrl,
} from "../../lib/profilePhotoUpload";
import {
  notifyProfileUpdated,
  PROFILE_UPDATED_EVENT,
} from "../../profileEvents";
import {
  getStoredCustomerName,
  getStoredProfilePhoto,
  setStoredCustomerName,
  setStoredProfilePhoto,
} from "../../userSession";

function getInitials(displayName) {
  const trimmed = String(displayName || "User").trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "U";
}

/** undefined = no photo change pending; null = remove on save; string = URL or data URL */
function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [name, setName] = useState(() => getStoredCustomerName());
  const [storedPhoto, setStoredPhotoState] = useState(() =>
    getStoredProfilePhoto(),
  );
  const [stagedPhoto, setStagedPhoto] = useState(undefined);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const displayPhoto =
    stagedPhoto === null
      ? null
      : stagedPhoto !== undefined
        ? stagedPhoto
        : storedPhoto;

  useEffect(() => {
    const sync = () => {
      setName(getStoredCustomerName());
      setStoredPhotoState(getStoredProfilePhoto());
      setStagedPhoto(undefined);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setSaveMessage("");
    setUploadingPhoto(true);
    try {
      const blob = await compressImageFileToJpegBlob(file);
      const publicUrl = await uploadProfilePhotoViaPresignedUrl(blob);
      setStoredProfilePhoto(publicUrl);
      setStoredPhotoState(publicUrl);
      setStagedPhoto(undefined);
      notifyProfileUpdated();
    } catch (e) {
      console.error(e);
      setError(
        e.message ||
          "Could not upload photo. Check your connection and S3/CORS settings.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setStagedPhoto(null);
    setSaveMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      await apiClient.post("/update-profile", { name: trimmed });
      setStoredCustomerName(trimmed);
      if (stagedPhoto === null) {
        setStoredProfilePhoto(null);
        setStoredPhotoState(null);
      } else if (typeof stagedPhoto === "string") {
        setStoredProfilePhoto(stagedPhoto);
        setStoredPhotoState(stagedPhoto);
      }
      setStagedPhoto(undefined);
      setName(trimmed);
      notifyProfileUpdated();
      setSaveMessage("Profile saved.");
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.message ||
          "Could not update your name on the server. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const pendingRemoval = stagedPhoto === null && storedPhoto != null;
  const canRemovePhoto =
    typeof stagedPhoto === "string" ||
    (stagedPhoto === undefined && storedPhoto != null);

  return (
    <main className="profile-page">
      <AuthBar userName={name} />
      <section className="profile-card" aria-labelledby="profile-heading">
        <h1 id="profile-heading">Your profile</h1>
        <p className="profile-subtitle">
          Your name is saved when you click Save changes. Profile photos upload
          immediately and are stored on your account and this device.
        </p>

        <div className="profile-avatar-block">
          <div className="profile-avatar-preview" aria-hidden>
            {displayPhoto ? (
              <img src={displayPhoto} alt="" className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-initials">
                {getInitials(name)}
              </span>
            )}
          </div>
          <div className="profile-avatar-actions">
            <button
              type="button"
              className="profile-btn secondary"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingPhoto ? "Uploading…" : "Upload photo"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="profile-file-input"
              onChange={handleFileChange}
              disabled={uploadingPhoto}
            />
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {error ? (
            <p className="profile-error" role="alert">
              {error}
            </p>
          ) : null}
          {saveMessage ? (
            <p className="profile-success">{saveMessage}</p>
          ) : null}

          <div className="profile-form-actions">
            <button
              type="submit"
              className="profile-btn primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="profile-btn secondary"
              onClick={() => navigate("/products")}
            >
              Back to products
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ProfilePage;
