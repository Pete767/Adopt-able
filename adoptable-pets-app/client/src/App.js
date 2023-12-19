import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import './App.css';
import Toxins from './Toxins';

function App() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    },[]);
    
    const fetchPets = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/pets?name${searchTerm}`, {
          headers: {
            'x-api-key': '4qHKXgfSzVbPVrZADVtJrJrsoPWjmTF6VcTGLVPk',
          }
    
        });
        const data = await response.json();
        setPets(data.animals);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
  useEffect(() => {
    fetchPets();
  }, [searchTerm]);

  const signup = async (userData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error(error);
    }
  };

  const login = async (loginData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');

    fetch(`${process.env.REACT_APP_API_URL}/logout`, {
      method: 'POST',
    });
  };

  const savePreferences = async ({ species, breed, preferences}) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ species, breed, preferences }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Adoptable Pets</Link>
            </li>
            <li>
              <Link to="/toxins">Common Pet Toxins</Link>
            </li>
            {user ? (
              <>
              <li>
                <Link to="/preferences">Preferences</Link>
                </li>
                <li>
                  <button onClick={logout}>Logout</button>
                  </li>
                  </>
            ) : (
              <>
              <li>
                <Link to="/signup">Sign Up</Link>
                </li>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                </>
            )}
          </ul>
        </nav>
        <Switch>
          <Route path="/toxins">
            <Toxins />
          </Route>
          {user && (
            <Route path='/preferences'>
              <Preferences savePreferences={savePreferences} />
            </Route>
          )}
          <Route path="/">
        <h1>Adoptable Pets</h1>
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {pets.map((pet) => (
              <li key={pet.id}>
                <img src={pet.photos.length > 0 ? pet.photos[0].medium : 'no-image'} alt={pet.name} />
                <h2>{pet.name}</h2>
                <p>{pet.description}</p>
              </li>
            ))}
          </ul>
        )}
          </Route>
        </Switch>
      </div>
    </Router>
    );
  }
  

export default App;
