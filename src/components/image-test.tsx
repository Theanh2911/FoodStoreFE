"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./product-image";

export function ImageTest() {
  const [testUrl, setTestUrl] = React.useState("https://via.placeholder.com/150");
  const [testResults, setTestResults] = React.useState<Array<{url: string, result: string, timestamp: string}>>([]);

  const testImageUrls = [
    "https://via.placeholder.com/150",
    "https://picsum.photos/150/150",
    "https://httpbin.org/image/jpeg",
    "https://jsonplaceholder.typicode.com/photos/1",
    "invalid-url",
    "",
    null
  ];

  const testSingleImage = async (url: string | null) => {
    const timestamp = new Date().toLocaleTimeString();
    try {
      if (!url) {
        setTestResults(prev => [...prev, { url: "null", result: "❌ Null URL", timestamp }]);
        return;
      }

      // Test if URL is reachable
      await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      setTestResults(prev => [...prev, { url, result: "✅ URL accessible", timestamp }]);
    } catch (error) {
      setTestResults(prev => [...prev, { url: url || "null", result: `❌ Error: ${error}`, timestamp }]);
    }
  };

  const testAllImages = () => {
    setTestResults([]);
    testImageUrls.forEach(url => testSingleImage(url));
  };

  const clearResults = () => setTestResults([]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-96 overflow-auto z-50 bg-yellow-50 border-yellow-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-800">🧪 Image URL Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Test custom URL */}
        <div className="space-y-2">
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter image URL to test"
            className="text-xs"
          />
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => testSingleImage(testUrl)}
              className="text-xs"
            >
              Test URL
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testAllImages}
              className="text-xs"
            >
              Test All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearResults}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Preview current test URL */}
        <div className="border rounded p-2 bg-white">
          <div className="text-xs text-gray-600 mb-1">Preview:</div>
          <ProductImage
            imageUrl={testUrl}
            productName="Test Item"
            categoryName="Đồ ăn"
            className="w-16 h-16"
          />
        </div>

        {/* Test results */}
        {testResults.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-700">Test Results:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs p-1 bg-white rounded border">
                  <div className="font-mono text-xs text-blue-600 truncate">
                    {result.url}
                  </div>
                  <div className="text-xs">
                    {result.result} <span className="text-gray-500">({result.timestamp})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
          <strong>How to use:</strong>
          <br />1. Enter your image URL above
          <br />2. Click &quot;Test URL&quot; to test one
          <br />3. Click &quot;Test All&quot; for common test URLs
          <br />4. Check browser console for detailed logs
        </div>
      </CardContent>
    </Card>
  );
}


