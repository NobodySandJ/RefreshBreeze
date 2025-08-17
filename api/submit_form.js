// /api/submit-form.js

export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ambil URL rahasia dari Environment Variables yang sudah Anda atur di Vercel
  const scriptURL = process.env.GOOGLE_SCRIPT_URL;

  // Cek apakah URL ada, jika tidak ada kirim pesan error
  if (!scriptURL) {
    return response.status(500).json({ result: 'error', message: 'Server configuration error: Google Script URL is not set.' });
  }
  
  try {
    // Teruskan data (request.body) dari frontend ke Google Apps Script
    const googleResponse = await fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify(request.body), // Vercel otomatis mem-parse body JSON
    });

    const data = await googleResponse.json();

    // Kirim kembali respons dari Google ke frontend
    response.status(200).json(data);

  } catch (error) {
    console.error("Error forwarding request to Google Script:", error);
    response.status(500).json({ result: 'error', message: error.message });
  }
}
