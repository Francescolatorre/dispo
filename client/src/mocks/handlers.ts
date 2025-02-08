import { http, HttpResponse } from 'msw';

interface LoginRequest {
  email: string;
  password: string;
}

export const handlers = [
  // Login handler
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as LoginRequest;

    // Simple mock validation
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'user',
        },
      });
    }

    return new HttpResponse(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
  }),

  // Logout handler
  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];