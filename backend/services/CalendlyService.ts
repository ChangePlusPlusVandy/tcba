// Calendly API integration service
import crypto from 'crypto';

interface CalendlyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface CalendlyEvent {
  name: string;
  location: {
    type: string;
    location?: string;
  };
  description?: string;
  duration: number;
  timezone?: string;
  scheduling_url?: string;
}

interface CalendlyInvitee {
  name: string;
  email: string;
  event: string;
  timezone?: string;
}

export class CalendlyService {
  private static readonly API_BASE_URL = 'https://api.calendly.com';
  private static readonly CLIENT_ID = process.env.CALENDLY_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.CALENDLY_CLIENT_SECRET;
  private static readonly WEBHOOK_SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  private static readonly REDIRECT_URI = process.env.CALENDLY_REDIRECT_URI;

  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;
  private static tokenExpiry: Date | null = null;

  /**
   * Exchange authorization code for access token (OAuth)
   */
  static async exchangeCodeForToken(code: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.CLIENT_ID!,
          client_secret: this.CLIENT_SECRET!,
          code,
          redirect_uri: this.REDIRECT_URI!,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to exchange code for token: ${response.statusText}`);
      }

      const data = (await response.json()) as CalendlyTokenResponse;
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

      console.log('[CalendlyService] OAuth token obtained successfully');
    } catch (error) {
      console.error('[CalendlyService] Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token
   */
  private static async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.CLIENT_ID!,
          client_secret: this.CLIENT_SECRET!,
          refresh_token: this.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = (await response.json()) as CalendlyTokenResponse;
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

      console.log('[CalendlyService] Access token refreshed successfully');
    } catch (error) {
      console.error('[CalendlyService] Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  private static async getAccessToken(): Promise<string> {
    // Check if token needs refresh
    if (this.tokenExpiry && this.tokenExpiry < new Date()) {
      await this.refreshAccessToken();
    }

    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    return this.accessToken;
  }

  /**
   * Make authenticated API request to Calendly
   */
  private static async apiRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getAccessToken();

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendly API error: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[CalendlyService] API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<any> {
    return await this.apiRequest('/users/me');
  }

  /**
   * Create an event type
   */
  static async createEventType(eventData: CalendlyEvent): Promise<any> {
    // Get current user to get organization URI
    const user = await this.getCurrentUser();
    const organizationUri = user.resource.current_organization;

    const payload = {
      name: eventData.name,
      duration: eventData.duration,
      description_plain: eventData.description,
      location: eventData.location,
      owner: user.resource.uri,
      organization: organizationUri,
      scheduling_url: eventData.scheduling_url,
    };

    return await this.apiRequest('/event_types', 'POST', payload);
  }

  /**
   * Get event type by URI
   */
  static async getEventType(eventTypeUri: string): Promise<any> {
    return await this.apiRequest(`/event_types/${eventTypeUri.split('/').pop()}`);
  }

  /**
   * Update an event type
   */
  static async updateEventType(
    eventTypeUri: string,
    updates: Partial<CalendlyEvent>
  ): Promise<any> {
    const eventTypeId = eventTypeUri.split('/').pop();
    return await this.apiRequest(`/event_types/${eventTypeId}`, 'PATCH', updates);
  }

  /**
   * Delete/Cancel an event type
   */
  static async deleteEventType(eventTypeUri: string): Promise<void> {
    const eventTypeId = eventTypeUri.split('/').pop();
    await this.apiRequest(`/event_types/${eventTypeId}`, 'DELETE');
  }

  /**
   * Schedule an invitee for an event
   */
  static async scheduleInvitee(inviteeData: CalendlyInvitee): Promise<any> {
    const payload = {
      name: inviteeData.name,
      email: inviteeData.email,
      event: inviteeData.event,
      timezone: inviteeData.timezone || 'America/Chicago',
    };

    return await this.apiRequest('/scheduled_events', 'POST', payload);
  }

  /**
   * Get all invitees for an event
   */
  static async getEventInvitees(eventUri: string): Promise<any[]> {
    const response = await this.apiRequest(`/scheduled_events/${eventUri}/invitees`);
    return response.collection || [];
  }

  /**
   * Cancel an invitee
   */
  static async cancelInvitee(inviteeUri: string, reason?: string): Promise<void> {
    await this.apiRequest(`/invitee_cancellations`, 'POST', {
      invitee: inviteeUri,
      reason: reason || 'Cancelled by user',
    });
  }

  /**
   * Verify Calendly webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    if (!this.WEBHOOK_SIGNING_KEY) {
      console.error('[CalendlyService] Webhook signing key not configured');
      return false;
    }

    try {
      // Calendly uses HMAC-SHA256 with the timestamp and payload
      const data = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SIGNING_KEY)
        .update(data, 'utf8')
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      console.error('[CalendlyService] Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Sync events from Calendly to local database
   */
  static async syncEvents(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      const response = await this.apiRequest(
        `/event_types?organization=${user.resource.current_organization}`
      );
      return response.collection || [];
    } catch (error) {
      console.error('[CalendlyService] Error syncing events:', error);
      throw error;
    }
  }

  /**
   * Set tokens manually (for testing or initialization from database)
   */
  static setTokens(accessToken: string, refreshToken: string, expiryDate: Date): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = expiryDate;
  }
}
