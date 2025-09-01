import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    
    if (!backendUrl) {
      console.error('BACKEND_API_URL not configured');
      return NextResponse.json(
        { detail: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { fileId } = await params;
    
    if (!fileId) {
      return NextResponse.json(
        { detail: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log(`Proxying request to get data for file: ${fileId}`);

    const response = await fetch(`${backendUrl}/api/data/${fileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.text();
    
    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Backend error: ${responseData}`);
      try {
        const errorJson = JSON.parse(responseData);
        return NextResponse.json(errorJson, { status: response.status });
      } catch {
        return NextResponse.json(
          { detail: responseData || 'Backend server error' },
          { status: response.status }
        );
      }
    }

    try {
      const jsonData = JSON.parse(responseData);
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError);
      console.error('Raw response:', responseData);
      return NextResponse.json(
        { detail: 'Invalid response from backend server' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
