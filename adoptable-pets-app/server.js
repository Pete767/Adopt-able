const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.ELEPHANT_SQL_URL,
  ssl: { rejectUnauthorized: false },
});
const PET_FINDER_API_KEY = process.env.PETFINDER_API_KEY;
const PET_FINDER_API_SECRET = process.env.PETFINDER_API_SECRET;

app.get('/api/pets', async (req, res) => {
  try {
    const response = await axios.get('https://api.petfinder.com/v2/animals', {
      params: { key: PET_FINDER_API_KEY, ...req.query },
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', [
      username,
      email,
      hashedPassword,
    ]);

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  });
};

app.get('/api/preferences', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM preferences WHERE user_id = $1', [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/preferences', verifyToken, async (req, res) => {
  const { species, breed, preferences, city, state } = req.body;

  try {
    await pool.query('INSERT INTO preferences (user_id, species, breed, preferences, city, state) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE SET species = $2, breed = $3, preferences = $4', city = $5, state = $6,
     [
      req.user.id,
      species,
      breed,
      preferences,
      city,
      state,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

cron.schedule('0 0 * * 0', async () => {
  try {

    const usersWithPreferences = await pool.query('SELECT * FROM preferences WHERE preferences IS NOT NULL');

    for (const user of usersWithPreferences.rows) {
      const localAnimals = await fetchLocalAnimals(user.preferences);

      const emailContent = generateEmailContent(user.username, localAnimals);
      await sendEmail(user.email, 'Weekly Newsletter', emailContent);
    }

    console.log('Weekly newsletters sent successfully');
  } catch (error) {
    console.error('Error sending weekly newsletters:', error);
  }
});

async function fetchLocalAnimals(preferences) {
  try {
  const response = await axios.get('https://api.petfinder.com/v2/animals', {
    params: { key: PET_FINDER_API_KEY, ...preferences, location: 'your-user-location' },
  });

  const localAnimals = response.data.animals;
  return localAnimals;
} catch (error) {
  console.error('Error fetching local animals:', error);
  return [];
}
}

function generateEmailContent(username, localAnimals) {
  if (localAnimals.length === 0) {
    return `<p>Hi ${username},</p>
            <p>Unfortunately, there are no animals matching your preferences available this week.</p>
            <p>Check back next week for more updates!</p>`;
  }

  const animalList = localAnimals
    .map((animal) => {
      return `<li>
                <img src="${animal.photos.length > 0 ? animal.photos[0].medium : 'no-image'}" alt="${animal.name}" />
                <h2>${animal.name}</h2>
                <p>${animal.description}</p>
              </li>`;
    })
    .join('');

  return `<p>Hi ${username},</p>
          <p>Here are some local animals that match your preferences:</p>
          <ul>${animalList}</ul>
          <p>Visit our website for more details and to adopt these lovely pets!</p>`;
}


async function sendEmail(to, subject, content) {
  try {
    const mailOptions = {
      from: 'your-email@gmail.com',
      to,
      subject,
      html: content,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});