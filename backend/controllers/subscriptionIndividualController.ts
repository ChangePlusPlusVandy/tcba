import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';

/**
 * @desc    Get all individual subscriptions
 * @route   GET /api/individual-subscriptions
 * @access  Admin/Super Admin
 */
export const getAllIndividualSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, startDate, endDate } = req.query;
    
    const where: any = {
      ...(startDate && endDate && {
        sentDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
      ...(search && {
        OR: [
          { subscription: { contains: search as string, mode: 'insensitive' } },
          { individual: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const subscriptions = await prisma.subscriptionIndividual.findMany({
      where,
      orderBy: { sentDate: 'desc' },
    });
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching individual subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch individual subscriptions' });
  }
};


/**
 * @desc    Create new individual subscription
 * @route   POST /api/individual-subscriptions
 * @access  Admin/Super Admin
 */
export const createIndividualSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscription, individual, sentDate } = req.body;

    if (!subscription || !individual || !sentDate) {
      return res.status(400).json({
        error: 'subscription, individual, and sentDate are required',
      });
    }

    const newSubscription = await prisma.subscriptionIndividual.create({
      data: {
        subscription,
        individual, 
        sentDate: new Date(sentDate),
      },
    });

    res.status(201).json(newSubscription);
  } catch (error) {
    console.error('Error creating individual subscription:', error);
    res.status(500).json({ error: 'Failed to create individual subscription' });
  }
};
  
  /**
   * @desc    Get individual subscription by ID
   * @route   GET /api/individual-subscriptions/:id
   * @access  Admin/Super Admin
   */
  export const getIndividualSubscriptionById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const subscription = await prisma.subscriptionIndividual.findUnique({
        where: { id },
      });
  
      if (!subscription) {
        return res.status(404).json({ error: 'Individual subscription not found' });
      }
  
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching individual subscription:', error);
      res.status(500).json({ error: 'Failed to fetch individual subscription' });
    }
  };
  
  /**
   * @desc    Update individual subscription
   * @route   PUT /api/individual-subscriptions/:id
   * @access  Admin/Super Admin
   */
  export const updateIndividualSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { subscription, individual, sentDate } = req.body;
  
      const updatedSubscription = await prisma.subscriptionIndividual.update({
        where: { id },
        data: {
          subscription,
          individual,
          sentDate: sentDate ? new Date(sentDate) : undefined,
        },
      });
  
      res.json(updatedSubscription);
    } catch (error) {
      console.error('Error updating individual subscription:', error);
      res.status(500).json({ error: 'Failed to update individual subscription' });
    }
  };
  
  /**
   * @desc    Delete individual subscription
   * @route   DELETE /api/individual-subscriptions/:id
   * @access  Admin/Super Admin
   */
  export const deleteIndividualSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
  
      await prisma.subscriptionIndividual.delete({
        where: { id },
      });
  
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting individual subscription:', error);
      res.status(500).json({ error: 'Failed to delete individual subscription' });
    }
  };