import { prisma } from '../config/prisma.js';
import { Request, Response } from 'express';

/**
 * @desc    Get all organizations with geolocation data for map display
 * @route   GET /api/map/organizations
 * @access  Public
 */
export const getMapOrganizations = async (req: Request, res: Response) => {
  try {
    // Only fetch active organizations with valid coordinates
    const organizations = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        website: true,
        region: true,
        organizationType: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(organizations);
  } catch (err) {
    console.error('Error fetching map organizations:', err);
    res.status(500).json({ error: 'Failed to fetch map organizations' });
  }
};

/**
 * @desc    Geocode an address to get latitude and longitude
 * @route   POST /api/map/geocode
 * @access  Public
 * @note    This endpoint uses the Google Geocoding API
 */
export const geocodeAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    // Call Google Geocoding API
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      res.status(200).json({
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
      });
    } else {
      res.status(404).json({
        error: 'Address not found',
        status: data.status,
      });
    }
  } catch (err) {
    console.error('Error geocoding address:', err);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
};
