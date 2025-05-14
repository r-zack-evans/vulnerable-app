import { Page } from '@playwright/test';

export interface RouteResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: string | object;
}

/**
 * Utility to set up a mock server for API requests
 */
export async function setupMockServer(page: Page) {
  // Intercept all API calls
  await page.route(/\/api\/.*/, (route) => {
    const url = route.request().url();
    console.log(`Intercepted request to: ${url}`);
    
    // By default, return a 404 Not Found for unhandled routes
    route.fulfill({
      status: 404,
      body: JSON.stringify({ error: 'Not Found - Route not mocked' }),
    });
  });
}

/**
 * Register a mock response for a specific API endpoint
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: RouteResponse = { status: 200 }
) {
  await page.route(urlPattern, (route) => {
    const responseObj: RouteResponse = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...response,
    };
    
    // Convert body object to JSON string if it's not already a string
    if (responseObj.body && typeof responseObj.body !== 'string') {
      responseObj.body = JSON.stringify(responseObj.body);
    }
    
    route.fulfill(responseObj);
  });
}