import { useEffect, useState } from 'react';
import '../styles/Profile.css';
import { fetchProfile, updateProfile } from '../services/api';

const Profile = ({ onUserUpdated }) => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetchProfile();

        if (!isMounted) {
          return;
        }

        setProfile(response);
        setAvatarInput(response.avatar || '');

        if (typeof onUserUpdated === 'function') {
          onUserUpdated(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load profile details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [onUserUpdated]);

  const handleSave = async () => {
    setError('');
    setSuccessMessage('');

    try {
      setIsSaving(true);
      const updatedProfile = await updateProfile({ avatar: avatarInput.trim() });
      setProfile(updatedProfile);

      if (typeof onUserUpdated === 'function') {
        onUserUpdated(updatedProfile);
      }

      setSuccessMessage('Profile updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarFallback = profile?.role ? profile.role.toUpperCase().charAt(0) : 'U';

  return (
    <section className="dashboard-section profile-section">
      <h2>Profile Settings</h2>

      {isLoading && <p>Loading profile...</p>}
      {error && <p className="profile-error">{error}</p>}

      {!isLoading && !error && profile && (
        <div className="profile-form" aria-live="polite">
          <div className="profile-avatar-section">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile avatar" className="profile-avatar-preview" />
            ) : (
              <div className="profile-avatar-preview profile-avatar-placeholder" aria-hidden="true">
                {avatarFallback}
              </div>
            )}
          </div>

          <div className="profile-input-group">
            <label htmlFor="profile-username">Username</label>
            <input id="profile-username" type="text" value={profile.username || ''} readOnly />
          </div>

          <div className="profile-input-group">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={profile.email || ''} readOnly />
          </div>

          <div className="profile-input-group">
            <label htmlFor="profile-role">Role</label>
            <input id="profile-role" type="text" value={String(profile.role || '').toUpperCase()} readOnly />
          </div>

          <div className="profile-input-group">
            <label htmlFor="profile-avatar">Avatar URL</label>
            <input
              id="profile-avatar"
              type="url"
              value={avatarInput}
              onChange={(event) => setAvatarInput(event.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="profile-actions">
            <button type="button" className="login-button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {successMessage && <p className="profile-success">{successMessage}</p>}
        </div>
      )}
    </section>
  );
};

export default Profile;
