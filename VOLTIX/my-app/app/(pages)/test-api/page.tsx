'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAPIPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const tests = [
    {
      name: 'Check API URL',
      test: async () => {
        return {
          apiUrl,
          isSet: !!process.env.NEXT_PUBLIC_API_URL,
          envVars: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC'))
        };
      }
    },
    {
      name: 'Test Backend Health',
      test: async () => {
        const response = await fetch(`${apiUrl}/api/health`);
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data
        };
      }
    },
    {
      name: 'Test Backend Root',
      test: async () => {
        const response = await fetch(`${apiUrl}/`);
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data
        };
      }
    },
    {
      name: 'Test CORS',
      test: async () => {
        const response = await fetch(`${apiUrl}/api/health`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          headers: {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
          },
          data
        };
      }
    },
    {
      name: 'Test Signup API',
      test: async () => {
        const testData = {
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          phone: '+919876543210',
          password: 'test123',
          city: 'Mumbai',
          vehicleType: 'sedan',
          vehicleMake: 'Tesla',
          vehicleModel: 'Model 3',
          vehicleYear: 2024,
          batteryCapacity: 60,
          registrationNumber: `MH01AB${Math.floor(Math.random() * 10000)}`
        };

        const response = await fetch(`${apiUrl}/api/auth/signup`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });

        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }

        return {
          status: response.status,
          ok: response.ok,
          headers: {
            'set-cookie': response.headers.get('set-cookie'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
          },
          data,
          testData
        };
      }
    },
    {
      name: 'Check Cookies',
      test: async () => {
        return {
          cookies: document.cookie,
          hasCookies: document.cookie.length > 0,
          localStorage: {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken')
          }
        };
      }
    }
  ];

  const runTest = async (test: typeof tests[0]) => {
    setLoading(true);
    try {
      const result = await test.test();
      setResults((prev: any) => ({
        ...prev,
        [test.name]: {
          success: true,
          result,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [test.name]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test your backend API connection and authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setResults({})}
            >
              Clear Results
            </Button>
          </div>

          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.name}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest(test)}
                      disabled={loading}
                    >
                      Run
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {results[test.name] ? (
                    <div className="space-y-2">
                      <div className={`p-2 rounded ${results[test.name].success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <p className="text-sm font-medium">
                          {results[test.name].success ? '✅ Success' : '❌ Failed'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {results[test.name].timestamp}
                        </p>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                        {JSON.stringify(
                          results[test.name].success 
                            ? results[test.name].result 
                            : results[test.name].error,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not run yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify({
                  apiUrl,
                  origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                  protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
