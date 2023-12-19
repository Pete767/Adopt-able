import React, { useState, useEffect } from 'react';

function Preferences({ savePreferences }) {
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [preferences, setPreferences] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/preferences`, {
          headers: {
            Authorization: localStorage.getItem('token'),
          },
        });
        const data = await response.json();
        setSpecies(data.species || '');
        setBreed(data.breed || '');
        setPreferences(data.preferences || '');
        setCity(data.city || '');
        setState(data.state || '');
      } catch (error) {
        console.error(error);
      }
    };

    fetchPreferences();
  }, []);

  const handleSpeciesChange = (e) => {
    setSpecies(e.target.value);
  };

  const handleBreedChange = (e) => {
    setBreed(e.target.value);
  };

  const handlePreferencesChange = (e) => {
    setPreferences(e.target.value);
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleStateChange = (e) => {
    setState(e.target.value);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    savePreferences({ species, breed, preferences, city, state });
  };

  return (
    <div>
      <h1>Preferences</h1>
      <form onSubmit={handleSubmit}>
      <label>
          Species:
          <input type="text" value={species} onChange={handleSpeciesChange} />
        </label>
        <br />
        <label>
          Breed:
          <input type="text" value={breed} onChange={handleBreedChange} />
        </label>
        <br />
        <label>
          Save your search preferences:
          <input type="text" value={preferences} onChange={handlePreferencesChange} />
        </label>
        <br />
        <label>
          City:
          <input type="text" value={city} onChange={handleCityChange} />
        </label>
        <br />
        <label>
          State:
          <input type="text" value={state} onChange={handleStateChange} />
        </label>
        <br />
        <button type="submit">Save Preferences</button>
      </form>
    </div>
  );
}

export default Preferences;
