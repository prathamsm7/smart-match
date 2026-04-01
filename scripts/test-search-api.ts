async function testSearchAPI() {
  const query = "0-2 years of experience in gen ai developer.";
  console.log(`🚀 Testing Smart Search API with query: "${query}"\n`);

  try {
    const response = await fetch('http://localhost:3000/api/recruiters/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        limit: 5
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    console.log(`✅ Success! Found ${data.candidates?.length || 0} results:`);
    data.candidates?.forEach((c: any, i: number) => {
      console.log(`${i + 1}. ${c.name} - Match Score: ${c.matchScore}`);
      console.log(`   Reason: ${c.reason}`);
      console.log(`   Skills: ${c.skills?.slice(0, 5).join(", ")}...`);
      console.log('---');
    });
  } catch (error) {
    console.error("❌ API Test failed (Make sure your dev server is running at http://localhost:3000):", error);
  }
}

testSearchAPI();
