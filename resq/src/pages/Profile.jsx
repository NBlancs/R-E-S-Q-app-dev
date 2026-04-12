import { useEffect, useState } from 'react';
import '../styles/Profile.css';
import { fetchProfile } from '../services/api';

const Profile = ({ onUserUpdated }) => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetchProfile();

        if (!isMounted) {
          return;
        }

        setProfile(response);

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

          <p className="profile-success">
            Profile updates are currently read-only because the backend does not yet expose a profile update endpoint.
          </p>
        </div>
      )}
    </section>
  );
};

export default Profile;
