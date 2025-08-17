// /api/submit-form.js

export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ambil URL rahasia dari Environment Variables
  const scriptURL = process.env.GOOGLE_SCRIPT_URL;

  try {
    // Teruskan data (request.body) dari frontend ke Google Apps Script
    const googleResponse = await fetch(scriptURL, {
      method: 'POST',
      // ================== PERBAIKAN DITAMBAHKAN DI SINI ==================
      // Menambahkan header Content-Type agar Google tahu ini adalah data JSON
      headers: {
        'Content-Type': 'application/json',
      },
      // =================================================================
      body: JSON.stringify(request.body),
    });

    const data = await googleResponse.json();

    // Kirim kembali respons dari Google ke frontend
    response.status(200).json(data);

  } catch (error) {
    console.error("Error:", error);
    response.status(500).json({ result: 'error', message: error.message });
  }
}
