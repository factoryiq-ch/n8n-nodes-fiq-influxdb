/// <reference types="../types/jest" />

import { InfluxDbApi } from '../credentials/InfluxDbApi.credentials';
import type { INodeProperties } from 'n8n-workflow';

describe('InfluxDbApi', () => {
  let credentials: InfluxDbApi;

  beforeEach(() => {
    credentials = new InfluxDbApi();
    jest.clearAllMocks();
  });

  it('should be defined and instantiable', () => {
    expect(credentials).toBeDefined();
    expect(credentials).toBeInstanceOf(InfluxDbApi);
  });

  it('should have correct name', () => {
    expect(credentials.name).toBe('influxDbApi');
  });

  it('should have correct displayName', () => {
    expect(credentials.displayName).toBe('InfluxDB API');
  });

  it('should have correct documentationUrl', () => {
    expect(credentials.documentationUrl).toBe('https://github.com/factoryiq-ch/n8n-nodes-fiq-influxdb?tab=readme-ov-file#configuration');
  });

  it('should have properties array with correct length', () => {
    expect(credentials.properties).toBeDefined();
    expect(Array.isArray(credentials.properties)).toBe(true);
    expect(credentials.properties.length).toBe(4);
  });

  describe('properties', () => {
    let properties: INodeProperties[];

    beforeEach(() => {
      properties = credentials.properties;
    });

    it('should have endpoint property with correct configuration', () => {
      const endpointProperty = properties.find(p => p.name === 'endpoint');

      expect(endpointProperty).toBeDefined();
      expect(endpointProperty?.displayName).toBe('Endpoint');
      expect(endpointProperty?.name).toBe('endpoint');
      expect(endpointProperty?.type).toBe('string');
      expect(endpointProperty?.default).toBe('http://localhost:8181');
      expect(endpointProperty?.required).toBe(true);
      expect(endpointProperty?.description).toContain('InfluxDB v3 API endpoint URL');
      expect(endpointProperty?.placeholder).toBe('http://localhost:8181');
    });

    it('should have token property with correct configuration', () => {
      const tokenProperty = properties.find(p => p.name === 'token');

      expect(tokenProperty).toBeDefined();
      expect(tokenProperty?.displayName).toBe('Token');
      expect(tokenProperty?.name).toBe('token');
      expect(tokenProperty?.type).toBe('string');
      expect(tokenProperty?.typeOptions?.password).toBe(true);
      expect(tokenProperty?.default).toBe('');
      expect(tokenProperty?.required).toBe(true);
      expect(tokenProperty?.description).toBe('InfluxDB v3 API token for authentication');
    });

    it('should have database property with correct configuration', () => {
      const databaseProperty = properties.find(p => p.name === 'database');

      expect(databaseProperty).toBeDefined();
      expect(databaseProperty?.displayName).toBe('Database');
      expect(databaseProperty?.name).toBe('database');
      expect(databaseProperty?.type).toBe('string');
      expect(databaseProperty?.default).toBe('');
      expect(databaseProperty?.required).toBe(true);
      expect(databaseProperty?.description).toBe('Name of the database to connect to');
      expect(databaseProperty?.placeholder).toBe('mydb');
    });

    it('should have organization property with correct configuration', () => {
      const orgProperty = properties.find(p => p.name === 'org');

      expect(orgProperty).toBeDefined();
      expect(orgProperty?.displayName).toBe('Organization');
      expect(orgProperty?.name).toBe('org');
      expect(orgProperty?.type).toBe('string');
      expect(orgProperty?.default).toBe('');
      expect(orgProperty?.required).toBe(false);
      expect(orgProperty?.description).toBe('Organization name (optional, required for Cloud instances)');
    });

    it('should have all properties with required fields', () => {
      properties.forEach((property, index) => {
        expect(property.name).toBeDefined();
        expect(typeof property.name).toBe('string');
        expect(property.displayName).toBeDefined();
        expect(typeof property.displayName).toBe('string');
        expect(property.type).toBeDefined();
        expect(typeof property.type).toBe('string');
        expect(property.default).toBeDefined();
      });
    });
  });

  describe('authenticate configuration', () => {
    it('should have correct authenticate configuration', () => {
      expect(credentials.authenticate).toBeDefined();
      expect(credentials.authenticate.type).toBe('generic');
      expect(credentials.authenticate.properties).toBeDefined();
      expect(credentials.authenticate.properties.headers).toBeDefined();

      if (credentials.authenticate.properties.headers) {
        expect(credentials.authenticate.properties.headers.Authorization).toBe('={{"Bearer " + $credentials.token}}');
      }
    });
  });

  describe('test configuration', () => {
    it('should have correct test request configuration', () => {
      expect(credentials.test).toBeDefined();
      expect(credentials.test.request).toBeDefined();

      const testRequest = credentials.test.request;
      expect(testRequest.baseURL).toBe('={{$credentials.endpoint}}');
      expect(testRequest.url).toBe('/api/v3/query_sql');
      expect(testRequest.method).toBe('POST');
      expect(testRequest.headers).toBeDefined();

      if (testRequest.headers) {
        expect((testRequest.headers as any).Authorization).toBe('={{"Bearer " + $credentials.token}}');
        expect((testRequest.headers as any)['Content-Type']).toBe('application/json');
      }
    });

    it('should have correct test request body', () => {
      const testRequestBody = credentials.test.request.body as any;

      expect(testRequestBody).toBeDefined();
      expect(testRequestBody.db).toBe('={{$credentials.database}}');
      expect(testRequestBody.q).toBe('SELECT table_name FROM information_schema.tables WHERE table_schema = \'iox\' LIMIT 1');
      expect(testRequestBody.format).toBe('json');
    });

    it('should have correct test rules', () => {
      expect(credentials.test.rules).toBeDefined();
      expect(Array.isArray(credentials.test.rules)).toBe(true);

      if (credentials.test.rules) {
        expect(credentials.test.rules.length).toBe(1);

        const rule = credentials.test.rules[0];
        expect(rule.type).toBe('responseSuccessBody');
        expect(rule.properties).toBeDefined();
        expect((rule.properties as any).key).toBe('');
        expect((rule.properties as any).value).toBe('');
        expect((rule.properties as any).message).toBe('InfluxDB connection test successful. Database accessible and credentials valid.');
      }
    });
  });

  describe('interface compliance', () => {
    it('should implement ICredentialType interface correctly', () => {
      expect(typeof credentials.name).toBe('string');
      expect(typeof credentials.displayName).toBe('string');
      expect(typeof credentials.documentationUrl).toBe('string');
      expect(Array.isArray(credentials.properties)).toBe(true);
      expect(typeof credentials.authenticate).toBe('object');
      expect(typeof credentials.test).toBe('object');
    });

    it('should have consistent property structure', () => {
      credentials.properties.forEach((property) => {
        expect(property).toHaveProperty('name');
        expect(property).toHaveProperty('displayName');
        expect(property).toHaveProperty('type');
        expect(property).toHaveProperty('default');

        if (property.name === 'token') {
          expect(property.typeOptions).toBeDefined();
          expect(property.typeOptions?.password).toBe(true);
        }
      });
    });

    it('should have required properties marked correctly', () => {
      const requiredProperties = ['endpoint', 'token', 'database'];
      const optionalProperties = ['org'];

      requiredProperties.forEach(propName => {
        const prop = credentials.properties.find(p => p.name === propName);
        expect(prop?.required).toBe(true);
      });

      optionalProperties.forEach(propName => {
        const prop = credentials.properties.find(p => p.name === propName);
        expect(prop?.required).toBe(false);
      });
    });
  });

  describe('credential values validation', () => {
    it('should have sensible default values', () => {
      const endpointProp = credentials.properties.find(p => p.name === 'endpoint');
      const tokenProp = credentials.properties.find(p => p.name === 'token');
      const databaseProp = credentials.properties.find(p => p.name === 'database');
      const orgProp = credentials.properties.find(p => p.name === 'org');

      expect(endpointProp?.default).toBe('http://localhost:8181');
      expect(tokenProp?.default).toBe('');
      expect(databaseProp?.default).toBe('');
      expect(orgProp?.default).toBe('');
    });

    it('should have helpful placeholders', () => {
      const endpointProp = credentials.properties.find(p => p.name === 'endpoint');
      const databaseProp = credentials.properties.find(p => p.name === 'database');

      expect(endpointProp?.placeholder).toBe('http://localhost:8181');
      expect(databaseProp?.placeholder).toBe('mydb');
    });

    it('should have descriptive field descriptions', () => {
      credentials.properties.forEach(property => {
        expect(property.description).toBeDefined();
        expect(typeof property.description).toBe('string');
        if (property.description) {
          expect(property.description.length).toBeGreaterThan(10);
        }
      });
    });
  });

  describe('authentication header format', () => {
    it('should use Bearer token format', () => {
      const authHeader = credentials.authenticate.properties.headers?.Authorization;
      expect(authHeader).toBe('={{"Bearer " + $credentials.token}}');
    });

    it('should reference the correct credential field', () => {
      const authHeader = credentials.authenticate.properties.headers?.Authorization;
      expect(authHeader).toContain('$credentials.token');
    });
  });

  describe('test query validation', () => {
    it('should use a safe test query', () => {
      const testQuery = (credentials.test.request.body as any).q;
      expect(testQuery).toContain('information_schema.tables');
      expect(testQuery).toContain('LIMIT 1');
      expect(testQuery).not.toContain('DROP');
      expect(testQuery).not.toContain('DELETE');
      expect(testQuery).not.toContain('UPDATE');
      expect(testQuery).not.toContain('INSERT');
    });

    it('should test against the iox schema', () => {
      const testQuery = (credentials.test.request.body as any).q;
      expect(testQuery).toContain('table_schema = \'iox\'');
    });
  });
});
