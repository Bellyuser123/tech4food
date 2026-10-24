import {
  ApiHealthResponse,
  ApiResponse,
  RestaurantProfile,
  PublicMenuResponse,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiService {
  public static async getHealth(): Promise<ApiHealthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const json: ApiResponse<ApiHealthResponse> = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'Invalid API health response');
      }

      return json.data;
    } catch (err: unknown) {
      console.warn('API Health Check failed:', err);
      throw err;
    }
  }

  public static async ping(): Promise<{ pong: boolean; timestamp: string }> {
    const res = await fetch(`${API_BASE_URL}/ping`);
    const json = await res.json();
    return json.data;
  }

  public static async getPublicRestaurantProfile(restaurantId: string): Promise<RestaurantProfile> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/public`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to load restaurant profile');
    return json.data;
  }

  public static async getPublicMenu(restaurantId: string): Promise<PublicMenuResponse> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menus`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to load public menu');
    return json.data;
  }

  public static async updateRestaurantProfile(
    restaurantId: string,
    token: string,
    profileData: Partial<RestaurantProfile>
  ): Promise<RestaurantProfile> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to update restaurant profile');
    return json.data;
  }

  public static async toggleMenuItemAvailability(
    restaurantId: string,
    token: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE_URL}/restaurants/${restaurantId}/menus/items/${itemId}/availability`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: isAvailable }),
      }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to toggle item availability');
  }

  public static async createMenuItem(
    restaurantId: string,
    token: string,
    itemData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menus/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create menu item');
    return json.data;
  }

  public static async deleteMenuItem(
    restaurantId: string,
    token: string,
    itemId: string
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE_URL}/restaurants/${restaurantId}/menus/items/${itemId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to delete menu item');
  }

  public static async uploadImage(
    token: string,
    base64Image: string,
    fileName: string
  ): Promise<{ url: string }> {
    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ base64Image, fileName }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to upload image');
    return json.data;
  }
}
