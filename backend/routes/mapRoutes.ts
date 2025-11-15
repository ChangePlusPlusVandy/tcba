import { Router } from 'express';
import { getMapOrganizations, geocodeAddress } from '../controllers/mapController';

const router = Router();

// Get all organizations with geolocation data
router.get('/organizations', getMapOrganizations);

// Geocode an address to get coordinates
router.post('/geocode', geocodeAddress);

export default router;
