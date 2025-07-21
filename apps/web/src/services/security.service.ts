// Security Service Implementation
class SecurityService {
  private readonly baseUrl: string;
  private readonly authToken: string;

  constructor() {
    this.baseUrl = process.env['REACT_APP_API_URL'] || 'http://localhost:3001/api';
    this.authToken = localStorage.getItem('authToken') || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSecuritySettings(clientId: string) {
    return this.makeRequest(`/security/settings/${clientId}`);
  }

  async updateSecuritySettings(clientId: string, settings: any) {
    return this.makeRequest(`/security/settings/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async setupTwoFactorAuth(clientId: string) {
    return this.makeRequest(`/security/2fa/setup/${clientId}`, {
      method: 'POST',
    });
  }

  async verifyTwoFactorAuth(clientId: string, token: string) {
    return this.makeRequest(`/security/2fa/verify/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async createSecureSession(
    clientId: string,
    deviceInfo: any,
    twoFactorVerified: boolean = false,
  ) {
    return this.makeRequest('/security/session/create', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        deviceInfo,
        twoFactorVerified,
      }),
    });
  }

  async validateSession(sessionToken: string) {
    return this.makeRequest('/security/session/validate', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    });
  }

  async performSecurityAudit(clientId: string) {
    return this.makeRequest(`/security/audit/${clientId}`);
  }

  async encryptData(data: string, key?: string) {
    return this.makeRequest('/security/encrypt', {
      method: 'POST',
      body: JSON.stringify({ data, key }),
    });
  }

  async decryptData(encryptedData: string, key: string, iv: string, tag: string) {
    return this.makeRequest('/security/decrypt', {
      method: 'POST',
      body: JSON.stringify({
        encryptedData,
        key,
        iv,
        tag,
      }),
    });
  }
}

export { SecurityService };
