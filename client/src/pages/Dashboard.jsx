import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { User, Shield, Briefcase, Server, RefreshCw, Users } from 'lucide-react';
import PageTitle from '../components/PageTitle';

export default function Dashboard() {
  const { state } = useAuth();
  const { settings } = useSettings();
  const [profile, setProfile] = useState(null);
  const [tallyStatus, setTallyStatus] = useState('Checking...');
  const [parentName, setParentName] = useState(null);

  useEffect(() => {
    if (state.accessToken) {
      fetch(`${settings.apiBaseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          if (!data.is_centraluser) {
            checkTally(data.tally_url, data.tally_port);
          }
          // Fetch parent name if employee
          if (data.parent_id) {
            fetch(`${settings.apiBaseUrl}/users/parent`, {
              headers: { Authorization: `Bearer ${state.accessToken}` }
            })
              .then(res => res.json())
              .then(parentData => {
                setParentName(parentData.fullname || 'Unknown');
              })
              .catch(err => {
                console.error(err);
                setParentName('Unknown');
              });
          }
        })
        .catch(err => console.error(err));
    }
  }, [state.accessToken]);

  const checkTally = (url, port) => {
    fetch(`${settings.apiBaseUrl}/tally/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.accessToken}`
      },
      body: JSON.stringify({ tally_url: url, tally_port: port })
    })
      .then(res => setTallyStatus(res.ok ? 'Connected' : 'Disconnected'))
      .catch(() => setTallyStatus('Error'));
  };

  const getUserType = (p) => {
    if (!p) return '...';
    if (p.is_centraluser) return 'Central User';
    if (p.role_id === 1) return 'Administrator';
    if (p.parent_id === null) return 'Main User';
    return 'Employee';
  };

  const cards = [
    { label: 'Full Name', value: profile?.fullname || 'Loading...', icon: User, color: '#3b82f6' },
    { label: 'Role', value: profile?.role || 'Loading...', icon: Shield, color: '#8b5cf6' },
    { label: 'User Type', value: getUserType(profile), icon: Briefcase, color: '#10b981' }
  ];

  // Add parent card for employees
  if (profile && profile.parent_id) {
    cards.push({
      label: 'Parent User',
      value: parentName || 'Loading...',
      icon: Users,
      color: '#f59e0b'
    });
  }

  if (profile && !profile.is_centraluser) {
    cards.push({
      label: 'Tally Status',
      value: tallyStatus,
      icon: Server,
      color: tallyStatus === 'Connected' ? '#22c55e' : '#ef4444'
    });
  }

  return (
    <div style={{ padding: '2rem', color: '#1e293b' }}>
      <PageTitle title="Dashboard" />
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard Overview</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {cards.map((card, idx) => (
          <div key={idx} style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid #334155'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: `${card.color}20`,
              color: card.color
            }}>
              <card.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{card.label}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', margin: 0 }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
