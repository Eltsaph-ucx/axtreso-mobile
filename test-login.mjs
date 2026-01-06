import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await fetch('http://localhost:3000/api/trpc/auth.loginManager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@salonbeaute.cg',
        password: 'TestPassword123'
      })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
