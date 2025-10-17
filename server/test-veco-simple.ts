import { checkVecoCompatibility, testVecoConnection } from './veco-service';

async function testVeco() {
  console.log('Testing VECO connection...');
  
  const connected = await testVecoConnection();
  console.log(`VECO connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
  
  if (connected) {
    console.log('\nTesting vehicle compatibility check...');
    const result = await checkVecoCompatibility('Ford', 'F-150', 2015);
    console.log('Result:', JSON.stringify(result, null, 2));
  }
}

testVeco().catch(console.error);
