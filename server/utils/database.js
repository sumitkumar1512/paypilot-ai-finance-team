import mongoose from 'mongoose';

// Environment variables can be present even when Atlas is temporarily unavailable.
// Only run database queries after Mongoose has an established connection; routes can
// then continue to provide the seeded demonstration data instead of timing out.
export const mongoReady = () => mongoose.connection.readyState === 1;
