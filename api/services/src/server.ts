import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import testController from './controllers/testController';
import roleController from './controllers/roleController';
import authController from './controllers/authController';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ---------- Miscellaneous routes ----------
app.get('/test', testController.getTest);

// ---------- Auth routes ----------
app.post('/login', authController.login);
app.post('/logout', authController.logout);
app.get('/verify-token', authController.verifyToken);

// ---------- Roles routes ----------
app.post('/create-role', roleController.createRole);
app.get('/get-roles', roleController.getRoles);

// ---------- Tenants routes ----------
// TODO: add tenant controllers and mount endpoints here (e.g., /create-tenant, /get-tenants)

// ---------- Users routes ----------
// TODO: add user controllers and mount endpoints here (e.g., /create-user, /get-users)

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

mongoose
  .connect(MONGO_URI, { dbName: 'flomingo_db' })
  .then(() => {
    console.log('Connected to DB:', mongoose.connection.name);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;
